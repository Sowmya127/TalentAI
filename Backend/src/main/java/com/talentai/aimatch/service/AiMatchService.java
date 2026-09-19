package com.talentai.aimatch.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.talentai.ai.BedrockService;
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
 * Candidate-job matching. The score is always deterministic and explainable —
 * computed from skill overlap, experience fit, and education presence, every
 * score carrying its supporting factors (Constraint C04 / NFR-AI-02). When
 * Amazon Bedrock is enabled ({@code ai.bedrock.enabled=true}) a qualitative
 * narrative (summary, strengths, concerns) is layered on top via
 * {@link BedrockService}; the numeric score is never altered by the model, and
 * any AI failure leaves the deterministic result intact.
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
    private final BedrockService bedrockService;

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

        MatchResult result = new MatchResult(matchId, candidateId, jobId, overall,
                new Breakdown(skillsScore, experienceScore, educationScore, preferredScore),
                matched, partial, missing, null, null, null);
        return enrichWithAi(result, candidate, job);
    }

    /**
     * When Bedrock is enabled, layers a qualitative narrative (summary, strengths,
     * concerns) on top of the deterministic score. The numeric score is never
     * changed by the model — it stays explainable. Any failure returns the
     * deterministic result unchanged.
     */
    private MatchResult enrichWithAi(MatchResult base, Candidate candidate, Job job) {
        if (!bedrockService.isEnabled()) {
            return base;
        }
        String system = "You are a recruitment assistant assessing how well a candidate fits a job. "
                + "Respond with ONLY compact JSON, no prose, in the form "
                + "{\"summary\": string (<=60 words), \"strengths\": string[] (max 3), "
                + "\"concerns\": string[] (max 3)}.";
        String user = ("Job title: %s%nMinimum experience required (years): %s%n"
                + "Candidate experience (years): %s%nMatched required skills: %s%n"
                + "Missing required skills: %s%nDeterministic match score: %d/100.%n"
                + "Assess the fit.")
                .formatted(
                        nz(job.getTitle()),
                        nz(job.getExperienceRequiredMin()),
                        nz(candidate.getTotalExperience()),
                        base.matchedSkills().isEmpty() ? "none" : String.join(", ", base.matchedSkills()),
                        base.missingSkills().isEmpty() ? "none" : String.join(", ", base.missingSkills()),
                        base.overallMatch());

        return bedrockService.completeJson(system, user)
                .map(json -> new MatchResult(base.matchId(), base.candidateId(), base.jobId(),
                        base.overallMatch(), base.breakdown(), base.matchedSkills(), base.partialMatches(),
                        base.missingSkills(),
                        json.path("summary").asText(null),
                        toStringList(json.path("strengths")),
                        toStringList(json.path("concerns"))))
                .orElse(base);
    }

    private static List<String> toStringList(JsonNode node) {
        if (node == null || !node.isArray()) {
            return List.of();
        }
        List<String> out = new ArrayList<>();
        node.forEach(n -> {
            String s = n.asText(null);
            if (s != null && !s.isBlank()) {
                out.add(s);
            }
        });
        return out;
    }

    private static String nz(Object o) {
        return o == null ? "unspecified" : o.toString();
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
