package com.talentai.job.service;

import com.talentai.common.exception.BusinessException;
import com.talentai.common.exception.ResourceNotFoundException;
import com.talentai.common.response.ListResponse;
import com.talentai.job.dto.JobDtos.*;
import com.talentai.job.entity.Job;
import com.talentai.job.entity.JobSkill;
import com.talentai.job.repository.JobRepository;
import com.talentai.job.repository.JobSkillRepository;
import com.talentai.skill.entity.Skill;
import com.talentai.skill.repository.SkillRepository;
import com.talentai.skill.service.SkillService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class JobService {

    private final JobRepository jobRepository;
    private final JobSkillRepository jobSkillRepository;
    private final SkillRepository skillRepository;
    private final SkillService skillService;

    @Transactional
    public CreateJobResponse create(CreateJobRequest req, Long actorUserId) {
        Job job = jobRepository.save(Job.builder()
                .title(req.title())
                .department(req.department())
                .location(req.location())
                .employmentType(req.employmentType())
                .experienceRequiredMin(req.minExperience())
                .experienceRequiredMax(req.maxExperience())
                .headcount(1)
                .jobStatus("Draft")
                .recruiterId(req.recruiterId())
                .hiringManagerId(req.hiringManagerId())
                .createdBy(actorUserId)
                .isActive(true)
                .build());
        replaceSkills(job.getJobId(), req.requiredSkills(), req.preferredSkills(), actorUserId);
        return new CreateJobResponse(job.getJobId(), "Draft", "Requisition created.");
    }

    @Transactional(readOnly = true)
    public JobDetailResponse getJob(Long jobId) {
        return toDetail(findOrThrow(jobId));
    }

    @Transactional
    public JobStatusResponse update(Long jobId, CreateJobRequest req, Long actorUserId) {
        Job job = findOrThrow(jobId);
        if (!"Draft".equals(job.getJobStatus())) {
            throw new BusinessException("JOB-002", "Only draft requisitions can be edited.");
        }
        job.setTitle(req.title());
        job.setDepartment(req.department());
        job.setLocation(req.location());
        job.setEmploymentType(req.employmentType());
        job.setExperienceRequiredMin(req.minExperience());
        job.setExperienceRequiredMax(req.maxExperience());
        job.setHiringManagerId(req.hiringManagerId());
        job.setRecruiterId(req.recruiterId());
        job.setModifiedBy(actorUserId);
        jobRepository.save(job);
        replaceSkills(jobId, req.requiredSkills(), req.preferredSkills(), actorUserId);
        return new JobStatusResponse(jobId, JobStatusMapper.toApi(job.getJobStatus()), "Requisition updated.");
    }

    @Transactional
    public JobStatusResponse submit(Long jobId, Long actorUserId) {
        Job job = findOrThrow(jobId);
        job.setJobStatus("Pending Approval");
        job.setModifiedBy(actorUserId);
        jobRepository.save(job);
        return new JobStatusResponse(jobId, "PendingApproval", null);
    }

    @Transactional
    public JobStatusResponse approve(Long jobId, ApproveJobRequest req, Long actorUserId) {
        Job job = findOrThrow(jobId);
        boolean approved = "Approved".equalsIgnoreCase(req.decision());
        job.setJobStatus(approved ? "Approved" : "Draft");
        job.setModifiedBy(actorUserId);
        jobRepository.save(job);
        return new JobStatusResponse(jobId, JobStatusMapper.toApi(job.getJobStatus()), null);
    }

    @Transactional
    public JobStatusResponse publish(Long jobId, Long actorUserId) {
        Job job = findOrThrow(jobId);
        if (!"Approved".equals(job.getJobStatus())) {
            throw new BusinessException("JOB-001", "Requisition must be approved before publishing.");
        }
        job.setJobStatus("Open");
        job.setModifiedBy(actorUserId);
        jobRepository.save(job);
        return new JobStatusResponse(jobId, "Published", null);
    }

    @Transactional
    public JobStatusResponse close(Long jobId, Long actorUserId) {
        return transition(jobId, "Closed", actorUserId);
    }

    @Transactional
    public JobStatusResponse archive(Long jobId, Long actorUserId) {
        return transition(jobId, "Cancelled", actorUserId);
    }

    private JobStatusResponse transition(Long jobId, String dbStatus, Long actorUserId) {
        Job job = findOrThrow(jobId);
        job.setJobStatus(dbStatus);
        job.setModifiedBy(actorUserId);
        jobRepository.save(job);
        return new JobStatusResponse(jobId, JobStatusMapper.toApi(dbStatus), null);
    }

    @Transactional(readOnly = true)
    public ListResponse<JobDetailResponse> search(String location, String skills, BigDecimal experience,
                                                  String status, int page, int size) {
        String dbStatus = JobStatusMapper.toDb(status);
        Page<Job> result = jobRepository.search(dbStatus,
                blankToNull(location), experience, blankToNull(skills),
                PageRequest.of(Math.max(0, page - 1), size));
        List<JobDetailResponse> data = result.getContent().stream().map(this::toDetail).toList();
        return ListResponse.of(data, result.getTotalElements(), page, size);
    }

    // --- helpers ---

    private Job findOrThrow(Long jobId) {
        return jobRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("Job not found: " + jobId));
    }

    private void replaceSkills(Long jobId, List<String> required, List<String> preferred, Long actorUserId) {
        jobSkillRepository.deleteByJobId(jobId);
        if (required != null) {
            for (String s : required) {
                addSkill(jobId, s, true, actorUserId);
            }
        }
        if (preferred != null) {
            for (String s : preferred) {
                addSkill(jobId, s, false, actorUserId);
            }
        }
    }

    private void addSkill(Long jobId, String rawName, boolean mandatory, Long actorUserId) {
        if (rawName == null || rawName.isBlank()) {
            return;
        }
        Skill skill = skillService.resolveOrCreate(rawName, actorUserId);
        jobSkillRepository.save(JobSkill.builder()
                .jobId(jobId).skillId(skill.getSkillId()).mandatoryFlag(mandatory)
                .createdBy(actorUserId).isActive(true).build());
    }

    private JobDetailResponse toDetail(Job job) {
        List<JobSkill> links = jobSkillRepository.findByJobIdAndIsActiveTrue(job.getJobId());
        Map<Integer, String> byId = links.isEmpty() ? Map.of()
                : skillRepository.findAllById(links.stream().map(JobSkill::getSkillId).toList()).stream()
                .collect(Collectors.toMap(Skill::getSkillId, Skill::getSkillName));
        List<String> required = links.stream().filter(JobSkill::getMandatoryFlag)
                .map(l -> byId.get(l.getSkillId())).filter(Objects::nonNull).toList();
        List<String> preferred = links.stream().filter(l -> !l.getMandatoryFlag())
                .map(l -> byId.get(l.getSkillId())).filter(Objects::nonNull).toList();
        return new JobDetailResponse(job.getJobId(), job.getTitle(), JobStatusMapper.toApi(job.getJobStatus()),
                required, preferred, job.getLocation(), job.getDepartment(), job.getEmploymentType(),
                job.getExperienceRequiredMin(), job.getExperienceRequiredMax());
    }

    private String blankToNull(String s) {
        return (s == null || s.isBlank()) ? null : s;
    }
}
