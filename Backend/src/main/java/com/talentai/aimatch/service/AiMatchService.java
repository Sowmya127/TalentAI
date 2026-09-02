package com.talentai.aimatch.service;

import com.talentai.aimatch.dto.AiMatchDtos.*;
import com.talentai.aimatch.entity.AiMatchDetail;
import com.talentai.aimatch.repository.AiMatchDetailRepository;
import com.talentai.application.entity.Application;
import com.talentai.application.repository.ApplicationRepository;
import com.talentai.application.service.ApplicationStatusMapper;
import com.talentai.candidate.entity.Candidate;
import com.talentai.candidate.entity.CandidateSkill;
import com.talentai.candidate.repository.CandidateRepository;
import com.talentai.candidate.repository.CandidateSkillRepository;
import com.talentai.candidate.repository.EducationRepository;
import com.talentai.common.exception.ResourceNotFoundException;
import com.talentai.common.response.ListResponse;
import com.talentai.job.entity.Job;
import com.talentai.job.entity.JobSkill;
import com.talentai.job.repository.JobRepository;
import com.talentai.job.repository.JobSkillRepository;
import com.talentai.skill.entity.Skill;
import com.talentai.skill.repository.SkillRepository;
import com.talentai.user.entity.User;
import com.talentai.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Deterministic, explainable candidate-job matching. No external LLM is
 * configured (OPENAI_API_KEY unset), so scores are computed from skill
 * overlap, experience fit, and education presence — every score carries
 * its supporting factors (Constraint C04 / NFR-AI-02).
 */
@Service
@RequiredArgsConstructor
public class AiMatchService {

    private final CandidateRepository candidateRepository;
    private final CandidateSkillRepository candidateSkillRepository;
    private final EducationRepository educationRepository;
    private final JobRepository jobRepository;
    private final JobSkillRepository jobSkillRepository;
    private final SkillRepository skillRepository;
    private final ApplicationRepository applicationRepository;
    private final AiMatchDetailRepository matchDetailRepository;
    private final UserRepository userRepository;

    @Transactional
    public MatchResult match(Long candidateId, Long jobId, Long actorUserId) {
        Candidate candidate = candidateRepository.findById(candidateId)
                .orElseThrow(() -> new ResourceNotFoundException("Candidate not found: " + candidateId));
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("Job not found: " + jobId));

        Set<Integer> candSkillIds = candidateSkillRepository.findByCandidateIdAndIsActiveTrue(candidateId)
                .stream().map(CandidateSkill::getSkillId).collect(Collectors.toSet());
        List<JobSkill> jobSkills = jobSkillRepository.findByJobIdAndIsActiveTrue(jobId);
        Map<Integer, String> skillNames = skillRepository.findAllById(
                        jobSkills.stream().map(JobSkill::getSkillId).toList()).stream()
                .collect(Collectors.toMap(Skill::getSkillId, Skill::getSkillName));

        List<JobSkill> mandatory = jobSkills.stream().filter(JobSkill::getMandatoryFlag).toList();
        List<JobSkill> preferred = jobSkills.stream().filter(js -> !js.getMandatoryFlag()).toList();

        List<String> matched = new ArrayList<>();
        List<String> missing = new ArrayList<>();
        for (JobSkill js : mandatory) {
            String name = skillNames.get(js.getSkillId());
            (candSkillIds.contains(js.getSkillId()) ? matched : missing).add(name);
        }
        List<PartialMatch> partial = new ArrayList<>();
        for (JobSkill js : preferred) {
            if (candSkillIds.contains(js.getSkillId())) {
                partial.add(new PartialMatch(skillNames.get(js.getSkillId()), "Preferred skill matched"));
            }
        }

        int skillsScore = mandatory.isEmpty() ? 100 : (int) Math.round(matched.size() * 100.0 / mandatory.size());
        int preferredScore = preferred.isEmpty() ? 0 : (int) Math.round(partial.size() * 100.0 / preferred.size());
        int experienceScore = experienceScore(candidate, job);
        int educationScore = educationRepository.findByCandidateIdAndIsActiveTrue(candidateId).isEmpty() ? 0 : 100;
        int overall = (int) Math.round(skillsScore * 0.5 + experienceScore * 0.3 + educationScore * 0.2);

        // Persist the score for audit (FR-AI-10), tied to the application if one exists.
        Long matchId = null;
        Application app = applicationRepository.findByJob(jobId, null,
                        org.springframework.data.domain.PageRequest.of(0, 1000)).getContent().stream()
                .filter(a -> a.getCandidateId().equals(candidateId)).findFirst().orElse(null);
        if (app != null) {
            AiMatchDetail detail = matchDetailRepository.save(AiMatchDetail.builder()
                    .applicationId(app.getApplicationId())
                    .overallScore(BigDecimal.valueOf(overall))
                    .skillsScore(BigDecimal.valueOf(skillsScore))
                    .experienceScore(BigDecimal.valueOf(experienceScore))
                    .educationScore(BigDecimal.valueOf(educationScore))
                    .matchedSkills(String.join(",", matched))
                    .missingSkills(String.join(",", missing))
                    .createdBy(actorUserId).isActive(true).build());
            matchId = detail.getMatchDetailId();
            app.setMatchScore(BigDecimal.valueOf(overall));
            applicationRepository.save(app);
        }

        return new MatchResult(matchId, candidateId, jobId, overall,
                new Breakdown(skillsScore, experienceScore, educationScore, preferredScore),
                matched, partial, missing);
    }

    @Transactional(readOnly = true)
    public ListResponse<RankedCandidate> ranking(Long jobId, int page, int size) {
        List<Application> apps = applicationRepository.findByJob(jobId, null,
                org.springframework.data.domain.PageRequest.of(Math.max(0, page - 1), size)).getContent();
        Map<Long, Candidate> candidates = candidateRepository.findAllById(apps.stream().map(Application::getCandidateId).toList())
                .stream().collect(Collectors.toMap(Candidate::getCandidateId, Function.identity()));
        Map<Long, User> users = userRepository.findAllById(candidates.values().stream().map(Candidate::getUserId).toList())
                .stream().collect(Collectors.toMap(User::getUserId, Function.identity()));
        List<RankedCandidate> data = apps.stream().map(a -> {
            Candidate c = candidates.get(a.getCandidateId());
            User u = c == null ? null : users.get(c.getUserId());
            String name = u == null ? "Candidate #" + a.getCandidateId() : u.getFirstName() + " " + u.getLastName();
            return new RankedCandidate(a.getCandidateId(), name,
                    a.getMatchScore() == null ? BigDecimal.ZERO : a.getMatchScore(),
                    ApplicationStatusMapper.toApi(a.getApplicationStatus()));
        }).toList();
        return ListResponse.of(data);
    }

    @Transactional(readOnly = true)
    public SkillGap skillGap(Long jobId, Long candidateId) {
        Set<Integer> candSkillIds = candidateSkillRepository.findByCandidateIdAndIsActiveTrue(candidateId)
                .stream().map(CandidateSkill::getSkillId).collect(Collectors.toSet());
        List<JobSkill> jobSkills = jobSkillRepository.findByJobIdAndIsActiveTrue(jobId);
        Map<Integer, String> skillNames = skillRepository.findAllById(
                        jobSkills.stream().map(JobSkill::getSkillId).toList()).stream()
                .collect(Collectors.toMap(Skill::getSkillId, Skill::getSkillName));
        List<String> matched = new ArrayList<>();
        List<String> missing = new ArrayList<>();
        List<String> partial = new ArrayList<>();
        for (JobSkill js : jobSkills) {
            String name = skillNames.get(js.getSkillId());
            if (js.getMandatoryFlag()) {
                (candSkillIds.contains(js.getSkillId()) ? matched : missing).add(name);
            } else if (candSkillIds.contains(js.getSkillId())) {
                partial.add(name);
            }
        }
        return new SkillGap(candidateId, jobId, matched, partial, missing);
    }

    private int experienceScore(Candidate candidate, Job job) {
        if (job.getExperienceRequiredMin() == null || candidate.getTotalExperience() == null) {
            return 100;
        }
        double required = job.getExperienceRequiredMin().doubleValue();
        double have = candidate.getTotalExperience().doubleValue();
        if (required <= 0) {
            return 100;
        }
        return (int) Math.min(100, Math.round(have / required * 100));
    }
}
