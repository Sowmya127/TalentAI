package com.talentai.registration.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

/** Registration + admin-approval request/response DTOs, grouped as static records. */
public final class RegistrationDtos {

    private RegistrationDtos() {
    }

    /** Result of POST /v1/auth/register. status = ACTIVE (candidate) or PENDING_APPROVAL. */
    public record RegistrationResult(Long userId, String status, String message) {
    }

    /** A role offered on the public "Register as" form. */
    public record RoleOption(String role, String description) {
    }

    /** One row in the admin pending-registration queue. */
    public record RegistrationRequestSummary(
            Long requestId,
            Long userId,
            String name,
            String email,
            String requestedRole,
            String companyName,
            String organizationEmail,
            String status,
            String submittedAt) {
    }

    /** Full detail for a single registration request. */
    public record RegistrationRequestDetail(
            Long requestId,
            Long userId,
            String name,
            String email,
            String phone,
            String requestedRole,
            String companyName,
            String organizationEmail,
            String status,
            String verificationStatus,
            String submittedAt,
            Long reviewedBy,
            String reviewedByName,
            String reviewedAt,
            String rejectionReason,
            List<ApprovalHistoryItem> history) {
    }

    public record ApprovalHistoryItem(
            Long approvalId,
            String decision,
            Long approverId,
            String approverName,
            String comments,
            String actionDate) {
    }

    public record ApproveRequest(@Size(max = 500) String comments) {
    }

    public record RejectRequest(@NotBlank(message = "A rejection reason is required") @Size(max = 500) String reason) {
    }

    public record RegistrationDecisionResponse(Long requestId, String status, String message) {
    }
}
