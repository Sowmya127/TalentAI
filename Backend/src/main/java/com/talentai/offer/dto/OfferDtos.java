package com.talentai.offer.dto;

import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public final class OfferDtos {

    private OfferDtos() {
    }

    public record Compensation(BigDecimal baseSalary, String currency, BigDecimal variablePay) {
    }

    public record GenerateOfferRequest(
            @NotNull Long applicationId,
            @NotNull Compensation compensation,
            String joiningDate) {
    }

    public record OfferStatusResponse(Long offerId, String status, String sentAt, String respondedAt) {
    }

    public record ApproveOfferRequest(@NotNull String decision, String comments) {
    }

    public record DeclineRequest(String declineReason) {
    }

    public record OfferResponse(
            Long offerId, Long applicationId, String status, Compensation compensation,
            String joiningDate, String candidateName, String jobTitle) {
    }
}
