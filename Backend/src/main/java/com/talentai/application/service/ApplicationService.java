package com.talentai.application.service;

import com.talentai.application.dto.ApplicationDtos.*;
import com.talentai.application.entity.Application;
import com.talentai.application.repository.ApplicationRepository;
import com.talentai.candidate.entity.Candidate;
import com.talentai.candidate.entity.CandidateSkill;
import com.talentai.candidate.repository.CandidateRepository;
import com.talentai.candidate.repository.CandidateSkillRepository;
import com.talentai.common.exception.BusinessException;
import com.talentai.common.exception.DuplicateResourceException;
import com.talentai.common.exception.ResourceNotFoundException;
import com.talentai.common.response.ListResponse;
import com.talentai.job.entity.Job;
import com.talentai.job.entity.JobSkill;
import com.talentai.job.repository.JobRepository;
import com.talentai.job.repository.JobSkillRepository;
import com.talentai.user.entity.User;
import com.talentai.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ApplicationService {

    private final ApplicationRepository applicationRepository;
    private final CandidateRepository candidateRepository;
    private final CandidateSkillRepository candidateSkillRepository;
    private final JobRepository jobRepository;
    private final JobSkillRepository jobSkillRepository;
    private final UserRepository userRepository;

    @Transactional
    public ApplyJobResponse apply(Long jobId, Long candidateId, Long actorUserId) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("Job not found: " + jobId));
        candidateRepository.findById(candidateId)
                .orElseThrow(() -> new ResourceNotFoundException("Candidate not found: " + candidateId));
        if (applicationRepository.existsByCandidateIdAndJobId(candidateId, jobId)) {
            throw new DuplicateResourceException("Candidate has already applied for this job.");
        }
        Application application = applicationRepository.save(Application.builder()
                .candidateId(candidateId)
                .jobId(jobId)
                .applicationStatus("Applied")
                .matchScore(computeMatchScore(candidateId, job.getJobId()))
                .consentGiven(true)
                .sourceChannel("Career Portal")
                .createdBy(actorUserId)
                .isActive(true)
                .build());
        return new ApplyJobResponse(application.getApplicationId(), "Applied", "Application submitted successfully.");
    }

    @Transactional
    public UpdateApplicationStatusResponse withdraw(Long applicationId, Long actorUserId) {
        Application a = findOrThrow(applicationId);
        a.setApplicationStatus("Withdrawn");
        a.setModifiedBy(actorUserId);
        applicationRepository.save(a);
        return new UpdateApplicationStatusResponse(applicationId, "Withdrawn");
    }

    @Transactional
    public UpdateApplicationStatusResponse updateStatus(Long applicationId, UpdateApplicationStatusRequest req, Long actorUserId) {
        if ("Rejected".equals(req.status()) && (req.reasonCode() == null || req.reasonCode().isBlank())) {
            throw new BusinessException("BR-037", "A reason code is required when rejecting a candidate.");
        }
        Application a = findOrThrow(applicationId);
        a.setApplicationStatus(ApplicationStatusMapper.toDb(req.status()));
        a.setModifiedBy(actorUserId);
        applicationRepository.save(a);
        return new UpdateApplicationStatusResponse(applicationId, ApplicationStatusMapper.toApi(a.getApplicationStatus()));
    }

    @Transactional(readOnly = true)
    public ListResponse<CandidateApplicationSummary> getCandidateApplications(Long candidateId) {
        List<Application> apps = applicationRepository.findByCandidateIdAndIsActiveTrueOrderByApplicationIdDesc(candidateId);
        Map<Long, String> jobTitles = jobRepository.findAllById(apps.stream().map(Application::getJobId).toList())
                .stream().collect(Collectors.toMap(Job::getJobId, Job::getTitle));
        List<CandidateApplicationSummary> data = apps.stream()
                .map(a -> new CandidateApplicationSummary(a.getApplicationId(),
                        jobTitles.getOrDefault(a.getJobId(), "—"),
                        ApplicationStatusMapper.toApi(a.getApplicationStatus()),
                        a.getAppliedDate() == null ? null : a.getAppliedDate().toLocalDate().toString()))
                .toList();
        return ListResponse.of(data);
    }

    @Transactional(readOnly = true)
    public ListResponse<ApplicantSummary> getApplicants(Long jobId, String status, int page, int size) {
        Page<Application> result = applicationRepository.findByJob(jobId, ApplicationStatusMapper.toDb(status),
                PageRequest.of(Math.max(0, page - 1), size));
        List<Application> apps = result.getContent();

        Map<Long, Candidate> candidates = candidateRepository.findAllById(apps.stream().map(Application::getCandidateId).toList())
                .stream().collect(Collectors.toMap(Candidate::getCandidateId, Function.identity()));
        Map<Long, User> users = userRepository.findAllById(candidates.values().stream().map(Candidate::getUserId).toList())
                .stream().collect(Collectors.toMap(User::getUserId, Function.identity()));

        List<ApplicantSummary> data = apps.stream().map(a -> {
            Candidate c = candidates.get(a.getCandidateId());
            User u = c == null ? null : users.get(c.getUserId());
            String name = u == null ? "Candidate #" + a.getCandidateId() : u.getFirstName() + " " + u.getLastName();
            return new ApplicantSummary(a.getApplicationId(), a.getCandidateId(), name, a.getMatchScore(),
                    ApplicationStatusMapper.toApi(a.getApplicationStatus()),
                    a.getAppliedDate() == null ? null : a.getAppliedDate().toLocalDate().toString());
        }).toList();
        return ListResponse.of(data, result.getTotalElements(), page, size);
    }

    /** Simple, explainable heuristic (no external AI): percentage of the job's
     *  mandatory skills the candidate has. */
    BigDecimal computeMatchScore(Long candidateId, Long jobId) {
        Set<Integer> candidateSkills = candidateSkillRepository.findByCandidateIdAndIsActiveTrue(candidateId)
                .stream().map(CandidateSkill::getSkillId).collect(Collectors.toSet());
        List<JobSkill> jobSkills = jobSkillRepository.findByJobIdAndIsActiveTrue(jobId).stream()
                .filter(JobSkill::getMandatoryFlag).toList();
        if (jobSkills.isEmpty()) {
            return null;
        }
        long matched = jobSkills.stream().filter(js -> candidateSkills.contains(js.getSkillId())).count();
        return BigDecimal.valueOf(matched * 100.0 / jobSkills.size()).setScale(2, RoundingMode.HALF_UP);
    }

    private Application findOrThrow(Long applicationId) {
        return applicationRepository.findByApplicationIdAndIsActiveTrue(applicationId)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found: " + applicationId));
    }
}
