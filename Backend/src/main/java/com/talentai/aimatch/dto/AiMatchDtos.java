package com.talentai.aimatch.dto;

import jakarta.validation.constraints.NotNull;

import java.util.List;

public final class AiMatchDtos {

    private AiMatchDtos() {
    }

    public record MatchRequest(@NotNull Long candidateId, @NotNull Long jobId) {
    }

    public record Breakdown(int skills, int experience, int education, int preferredSkills) {
    }

    public record PartialMatch(String skill, String note) {
    }

    /**
     * The deterministic score/breakdown is always populated. {@code aiInsight},
     * {@code strengths} and {@code concerns} are added by Amazon Bedrock when it
     * is enabled, and are null/empty otherwise — the numeric score stays the
     * explainable, deterministic one either way.
     */
    public record MatchResult(
            Long matchId, Long candidateId, Long jobId, int overallMatch, Breakdown breakdown,
            List<String> matchedSkills, List<PartialMatch> partialMatches, List<String> missingSkills,
            String aiInsight, List<String> strengths, List<String> concerns) {
    }

    public record RankedCandidate(Long candidateId, String name, java.math.BigDecimal matchScore, String status) {
    }

    public record SkillGap(Long candidateId, Long jobId, List<String> matched, List<String> partial, List<String> missing) {
    }
}
