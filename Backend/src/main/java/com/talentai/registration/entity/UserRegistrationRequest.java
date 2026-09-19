package com.talentai.registration.entity;

import com.talentai.common.entity.BaseAuditableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import java.time.LocalDateTime;

/** A self-registration submission that requires admin review (V33). FK columns
 *  are plain ids (not @ManyToOne) to match this codebase's open-in-view=false
 *  convention. */
@Entity
@Table(name = "user_registration_request")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@EqualsAndHashCode(callSuper = false)
public class UserRegistrationRequest extends BaseAuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "request_id")
    private Long requestId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "requested_role_id", nullable = false)
    private Integer requestedRoleId;

    @Column(name = "company_id")
    private Long companyId;

    @Column(name = "organization_email", length = 150)
    private String organizationEmail;

    /** PENDING_APPROVAL | APPROVED | REJECTED. */
    @Column(name = "status", nullable = false, length = 20)
    private String status;

    @Column(name = "submitted_at", nullable = false)
    private LocalDateTime submittedAt;

    @Column(name = "reviewed_by")
    private Long reviewedBy;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @Column(name = "rejection_reason", length = 500)
    private String rejectionReason;
}
