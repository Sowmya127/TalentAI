package com.talentai.application.dto;

import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public final class ApplicationDtos {

    private ApplicationDtos() {
    }

    public record ApplyJobRequest(@NotNull(message = "candidateId is required") Long candidateId) {
    }

    public record ApplyJobResponse(Long applicationId, String status, String message) {
    }

    public record CandidateApplicationSummary(Long applicationId, String jobTitle, String status, String appliedOn) {
    }

    public record ApplicantSummary(Long applicationId, Long candidateId, String candidateName,
                                   BigDecimal matchScore, String status, String appliedOn) {
    }

    public record UpdateApplicationStatusRequest(@NotNull String status, String reasonCode, String comments) {
    }

    public record UpdateApplicationStatusResponse(Long applicationId, String status) {
    }
}
