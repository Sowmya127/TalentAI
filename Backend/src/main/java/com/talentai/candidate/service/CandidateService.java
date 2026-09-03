package com.talentai.candidate.service;

import com.talentai.candidate.dto.CandidateDtos.*;
import com.talentai.candidate.entity.Candidate;
import com.talentai.candidate.entity.CandidateSkill;
import com.talentai.candidate.entity.Certification;
import com.talentai.candidate.entity.Education;
import com.talentai.candidate.entity.WorkExperience;
import com.talentai.candidate.repository.CandidateRepository;
import com.talentai.candidate.repository.CandidateSkillRepository;
import com.talentai.candidate.repository.CertificationRepository;
import com.talentai.candidate.repository.EducationRepository;
import com.talentai.candidate.repository.WorkExperienceRepository;
import com.talentai.common.exception.DuplicateResourceException;
import com.talentai.common.exception.ResourceNotFoundException;
import com.talentai.skill.entity.Skill;
import com.talentai.skill.repository.SkillRepository;
import com.talentai.skill.service.SkillService;
import com.talentai.user.entity.User;
import com.talentai.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CandidateService {

    private final CandidateRepository candidateRepository;
    private final CandidateSkillRepository candidateSkillRepository;
    private final EducationRepository educationRepository;
    private final WorkExperienceRepository workExperienceRepository;
    private final CertificationRepository certificationRepository;
    private final SkillRepository skillRepository;
    private final SkillService skillService;
    private final UserRepository userRepository;

    @Value("${file.upload-path:./uploads/resumes}")
    private String uploadPath;

    // --- Profile ---

    @Transactional
    public CandidateMessageResponse createProfile(CreateCandidateRequest req, Long actorUserId) {
        if (candidateRepository.existsByUserId(req.userId())) {
            throw new DuplicateResourceException("A candidate profile already exists for this user.");
        }
        User user = userRepository.findById(req.userId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + req.userId()));
        if (req.phone() != null && !req.phone().isBlank()) {
            user.setPhoneNumber(req.phone());
            userRepository.save(user);
        }
        Candidate candidate = Candidate.builder()
                .userId(req.userId())
                .currentLocation(req.location())
                .totalExperience(BigDecimal.ZERO)
                .createdBy(actorUserId)
                .isActive(true)
                .build();
        candidate = candidateRepository.save(candidate);
        return new CandidateMessageResponse(candidate.getCandidateId(), "Candidate profile created.");
    }

    @Transactional(readOnly = true)
    public CandidateProfileResponse getMyProfile(Long userId) {
        Candidate candidate = candidateRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("No candidate profile found for this user."));
        return toProfile(candidate);
    }

    @Transactional(readOnly = true)
    public CandidateProfileResponse getProfile(Long candidateId) {
        return toProfile(findOrThrow(candidateId));
    }

    @Transactional
    public CandidateMessageResponse updateProfile(Long candidateId, UpdateCandidateRequest req, Long actorUserId) {
        Candidate c = findOrThrow(candidateId);
        if (req.location() != null) {
            c.setCurrentLocation(req.location());
        }
        if (req.noticePeriod() != null) {
            c.setNoticePeriodDays(parseLeadingInt(req.noticePeriod()));
        }
        if (req.salaryExpectation() != null) {
            c.setSalaryExpectation(req.salaryExpectation());
        }
        c.setModifiedBy(actorUserId);
        candidateRepository.save(c);
        return new CandidateMessageResponse(candidateId, "Profile updated successfully.");
    }

    private CandidateProfileResponse toProfile(Candidate c) {
        User user = userRepository.findById(c.getUserId()).orElse(null);
        String name = user != null ? (user.getFirstName() + " " + user.getLastName()) : "";
        String email = user != null ? user.getEmail() : "";
        String phone = user != null ? user.getPhoneNumber() : null;

        List<String> skills = skillNames(c.getCandidateId());
        String education = educationRepository.findByCandidateIdAndIsActiveTrue(c.getCandidateId()).stream()
                .max(Comparator.comparing(e -> e.getGraduationYear() == null ? 0 : e.getGraduationYear()))
                .map(Education::getDegree)
                .orElse(null);
        String noticePeriod = c.getNoticePeriodDays() == null ? null : c.getNoticePeriodDays() + " days";

        return new CandidateProfileResponse(c.getCandidateId(), name, email, c.getCurrentLocation(), skills,
                computeExperience(c), education, c.getResumeUrl(), phone, noticePeriod, c.getSalaryExpectation());
    }

    /** Total experience shown on the profile is derived from the candidate's
     *  work-experience entries (sum of each role's duration; current roles run
     *  to today). Falls back to the stored total_experience when no entries exist. */
    private BigDecimal computeExperience(Candidate c) {
        List<WorkExperience> entries = workExperienceRepository.findByCandidateIdAndIsActiveTrue(c.getCandidateId());
        if (entries.isEmpty()) {
            return c.getTotalExperience();
        }
        long totalMonths = 0;
        for (WorkExperience w : entries) {
            if (w.getStartDate() == null) {
                continue;
            }
            LocalDate end = w.getEndDate() != null ? w.getEndDate() : LocalDate.now();
            long months = java.time.temporal.ChronoUnit.MONTHS.between(
                    w.getStartDate().withDayOfMonth(1), end.withDayOfMonth(1));
            if (months > 0) {
                totalMonths += months;
            }
        }
        return BigDecimal.valueOf(totalMonths / 12.0).setScale(1, java.math.RoundingMode.HALF_UP);
    }

    // --- Skills ---

    @Transactional(readOnly = true)
    public SkillsResponse getSkills(Long candidateId) {
        findOrThrow(candidateId);
        return new SkillsResponse(candidateId, skillNames(candidateId));
    }

    @Transactional
    public SkillsResponse updateSkills(Long candidateId, List<String> skills, Long actorUserId) {
        findOrThrow(candidateId);
        candidateSkillRepository.deleteByCandidateId(candidateId);
        for (String raw : skills) {
            if (raw == null || raw.isBlank()) {
                continue;
            }
            Skill skill = skillService.resolveOrCreate(raw, actorUserId);
            candidateSkillRepository.save(CandidateSkill.builder()
                    .candidateId(candidateId)
                    .skillId(skill.getSkillId())
                    .yearsExperience(BigDecimal.ZERO)
                    .createdBy(actorUserId)
                    .isActive(true)
                    .build());
        }
        return new SkillsResponse(candidateId, skillNames(candidateId));
    }

    private List<String> skillNames(Long candidateId) {
        List<CandidateSkill> links = candidateSkillRepository.findByCandidateIdAndIsActiveTrue(candidateId);
        if (links.isEmpty()) {
            return List.of();
        }
        Map<Integer, String> byId = skillRepository.findAllById(
                        links.stream().map(CandidateSkill::getSkillId).toList()).stream()
                .collect(Collectors.toMap(Skill::getSkillId, Skill::getSkillName));
        return links.stream().map(l -> byId.get(l.getSkillId())).filter(java.util.Objects::nonNull).toList();
    }

    // --- Education ---

    @Transactional(readOnly = true)
    public List<EducationResponse> getEducation(Long candidateId) {
        return educationRepository.findByCandidateIdAndIsActiveTrue(candidateId).stream()
                .map(this::toEducation).toList();
    }

    @Transactional
    public EducationResponse addEducation(Long candidateId, EducationRequest req, Long actorUserId) {
        findOrThrow(candidateId);
        Education e = educationRepository.save(Education.builder()
                .candidateId(candidateId)
                .degree(req.degree())
                .institution(req.institution())
                .graduationYear(req.endYear() != null ? req.endYear().shortValue()
                        : (req.startYear() != null ? req.startYear().shortValue() : null))
                .createdBy(actorUserId)
                .isActive(true)
                .build());
        return toEducation(e);
    }

    @Transactional
    public EducationResponse updateEducation(Long candidateId, Long educationId, EducationRequest req, Long actorUserId) {
        Education e = educationRepository.findById(educationId)
                .orElseThrow(() -> new ResourceNotFoundException("Education not found: " + educationId));
        e.setDegree(req.degree());
        e.setInstitution(req.institution());
        e.setGraduationYear(req.endYear() != null ? req.endYear().shortValue()
                : (req.startYear() != null ? req.startYear().shortValue() : null));
        e.setModifiedBy(actorUserId);
        return toEducation(educationRepository.save(e));
    }

    @Transactional
    public void deleteEducation(Long educationId) {
        educationRepository.deleteById(educationId);
    }

    private EducationResponse toEducation(Education e) {
        // fieldOfStudy and startYear have no column in the education table (V10);
        // graduation_year maps to endYear. Returned as null to keep the UI shape.
        Integer endYear = e.getGraduationYear() == null ? null : (int) (short) e.getGraduationYear();
        return new EducationResponse(e.getEducationId(), e.getDegree(), e.getInstitution(), null, null, endYear);
    }

    // --- Work experience ---

    @Transactional(readOnly = true)
    public List<WorkExperienceResponse> getWorkExperience(Long candidateId) {
        return workExperienceRepository.findByCandidateIdAndIsActiveTrue(candidateId).stream()
                .map(this::toWork).toList();
    }

    @Transactional
    public WorkExperienceResponse addWorkExperience(Long candidateId, WorkExperienceRequest req, Long actorUserId) {
        findOrThrow(candidateId);
        WorkExperience w = workExperienceRepository.save(WorkExperience.builder()
                .candidateId(candidateId)
                .companyName(req.companyName())
                .designation(req.jobTitle())
                .startDate(parseDate(req.startDate()))
                .endDate(Boolean.TRUE.equals(req.isCurrent()) ? null : parseDate(req.endDate()))
                .responsibilities(req.description())
                .createdBy(actorUserId)
                .isActive(true)
                .build());
        return toWork(w);
    }

    @Transactional
    public WorkExperienceResponse updateWorkExperience(Long candidateId, Long id, WorkExperienceRequest req, Long actorUserId) {
        WorkExperience w = workExperienceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Work experience not found: " + id));
        w.setCompanyName(req.companyName());
        w.setDesignation(req.jobTitle());
        w.setStartDate(parseDate(req.startDate()));
        w.setEndDate(Boolean.TRUE.equals(req.isCurrent()) ? null : parseDate(req.endDate()));
        w.setResponsibilities(req.description());
        w.setModifiedBy(actorUserId);
        return toWork(workExperienceRepository.save(w));
    }

    @Transactional
    public void deleteWorkExperience(Long id) {
        workExperienceRepository.deleteById(id);
    }

    private WorkExperienceResponse toWork(WorkExperience w) {
        return new WorkExperienceResponse(w.getExperienceId(), w.getCompanyName(), w.getDesignation(),
                w.getStartDate() == null ? null : w.getStartDate().toString(),
                w.getEndDate() == null ? null : w.getEndDate().toString(),
                w.getEndDate() == null, w.getResponsibilities());
    }

    // --- Certifications ---

    @Transactional(readOnly = true)
    public List<CertificationResponse> getCertifications(Long candidateId) {
        return certificationRepository.findByCandidateIdAndIsActiveTrue(candidateId).stream()
                .map(this::toCert).toList();
    }

    @Transactional
    public CertificationResponse addCertification(Long candidateId, CertificationRequest req, Long actorUserId) {
        findOrThrow(candidateId);
        Certification c = certificationRepository.save(Certification.builder()
                .candidateId(candidateId)
                .certificationName(req.name())
                .issuedBy(req.issuer())
                .issueDate(parseDate(req.issueDate()))
                .createdBy(actorUserId)
                .isActive(true)
                .build());
        return toCert(c);
    }

    @Transactional
    public void deleteCertification(Long id) {
        certificationRepository.deleteById(id);
    }

    private CertificationResponse toCert(Certification c) {
        return new CertificationResponse(c.getCertificationId(), c.getCertificationName(), c.getIssuedBy(),
                c.getIssueDate() == null ? null : c.getIssueDate().toString());
    }

    // --- Resume ---

    @Transactional
    public ResumeUploadResponse uploadResume(Long candidateId, MultipartFile file, Long actorUserId) {
        Candidate c = findOrThrow(candidateId);
        try {
            Path dir = Paths.get(uploadPath);
            Files.createDirectories(dir);
            String original = file.getOriginalFilename() == null ? "resume" : file.getOriginalFilename();
            String stored = candidateId + "_" + original.replaceAll("[^a-zA-Z0-9._-]", "_");
            Path target = dir.resolve(stored);
            file.transferTo(target.toAbsolutePath().toFile());
            c.setResumeUrl("/files/resumes/" + stored);
            c.setModifiedBy(actorUserId);
            candidateRepository.save(c);
            return new ResumeUploadResponse(candidateId, original, "Uploaded");
        } catch (IOException e) {
            throw new com.talentai.common.exception.BusinessException("RESUME_UPLOAD_FAILED",
                    "Could not store the uploaded resume.");
        }
    }

    /**
     * No external AI service is configured (OPENAI_API_KEY is unset), so this
     * returns a deterministic extraction built from the candidate's existing
     * structured data rather than calling an LLM. Status is PendingReview per
     * BR-021/BR-022 (recruiter must review before it overwrites verified fields).
     */
    @Transactional(readOnly = true)
    public ResumeParseResponse parseResume(Long candidateId) {
        Candidate c = findOrThrow(candidateId);
        List<String> skills = skillNames(candidateId);
        List<String> certs = certificationRepository.findByCandidateIdAndIsActiveTrue(candidateId).stream()
                .map(Certification::getCertificationName).toList();
        List<String> companies = workExperienceRepository.findByCandidateIdAndIsActiveTrue(candidateId).stream()
                .map(WorkExperience::getCompanyName).toList();
        String education = educationRepository.findByCandidateIdAndIsActiveTrue(candidateId).stream()
                .findFirst().map(Education::getDegree).orElse(null);
        ResumeParseExtracted extracted = new ResumeParseExtracted(skills, c.getTotalExperience(), education, certs, companies);
        return new ResumeParseResponse(candidateId, extracted, "PendingReview");
    }

    // --- helpers ---

    private Candidate findOrThrow(Long candidateId) {
        return candidateRepository.findById(candidateId)
                .orElseThrow(() -> new ResourceNotFoundException("Candidate not found: " + candidateId));
    }

    public Long resolveCandidateId(Long userId) {
        return candidateRepository.findByUserId(userId).map(Candidate::getCandidateId)
                .orElseThrow(() -> new ResourceNotFoundException("No candidate profile found for this user."));
    }

    private static final Pattern LEADING_INT = Pattern.compile("(\\d+)");

    private Integer parseLeadingInt(String s) {
        if (s == null) {
            return null;
        }
        Matcher m = LEADING_INT.matcher(s);
        return m.find() ? Integer.valueOf(m.group(1)) : null;
    }

    private LocalDate parseDate(String s) {
        if (s == null || s.isBlank()) {
            return null;
        }
        try {
            return LocalDate.parse(s.length() > 10 ? s.substring(0, 10) : s);
        } catch (Exception e) {
            return null;
        }
    }
}
