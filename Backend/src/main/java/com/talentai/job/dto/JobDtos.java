package com.talentai.job.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.List;

public final class JobDtos {

    private JobDtos() {
    }

    public record CreateJobRequest(
            @NotBlank(message = "title is required") String title,
            String department,
            String location,
            String employmentType,
            List<String> requiredSkills,
            List<String> preferredSkills,
            BigDecimal minExperience,
            BigDecimal maxExperience,
            @NotNull(message = "hiringManagerId is required") Long hiringManagerId,
            @NotNull(message = "recruiterId is required") Long recruiterId) {
    }

    public record CreateJobResponse(Long jobId, String status, String message) {
    }

    public record JobStatusResponse(Long jobId, String status, String message) {
    }

    public record ApproveJobRequest(@NotBlank String decision, String comments) {
    }

    public record JobDetailResponse(
            Long jobId,
            String title,
            String status,
            List<String> requiredSkills,
            List<String> preferredSkills,
            String location,
            String department,
            String employmentType,
            BigDecimal minExperience,
            BigDecimal maxExperience) {
    }
}
