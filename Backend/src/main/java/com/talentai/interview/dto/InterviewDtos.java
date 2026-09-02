package com.talentai.interview.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public final class InterviewDtos {

    private InterviewDtos() {
    }

    public record ScheduleInterviewRequest(
            @NotNull Long applicationId,
            String interviewType,
            @NotNull Long interviewerId,
            @NotBlank String scheduledAt,
            Integer durationMinutes,
            String mode) {
    }

    public record InterviewStatusResponse(Long interviewId, String status) {
    }

    public record InterviewResponse(
            Long interviewId, Long applicationId, Long interviewerId, String scheduledAt, String status,
            String interviewType, String mode, Integer durationMinutes, String candidateName, String jobTitle) {
    }

    public record RescheduleRequest(@NotBlank String newScheduledAt, String reason) {
    }

    public record CancelRequest(String reason) {
    }

    public record FeedbackRequest(
            @NotNull Integer technical,
            @NotNull Integer communication,
            @NotNull Integer problemSolving,
            @NotNull Integer domainKnowledge,
            String comments,
            @NotBlank String recommendation) {
    }

    public record FeedbackResponse(Long feedbackId, Long interviewId, String status) {
    }

    public record PanelistFeedback(
            Long interviewerId, String interviewerName, String recommendation,
            Integer technical, Integer communication, Integer problemSolving, Integer domainKnowledge, String comments) {
    }

    public record FeedbackSummaryResponse(Long interviewId, List<PanelistFeedback> panel, String consolidatedRecommendation) {
    }
}
