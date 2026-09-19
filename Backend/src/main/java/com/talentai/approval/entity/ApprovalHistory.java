package com.talentai.approval.entity;

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

/** Polymorphic approval trail (V20), reused for Job, Offer and — as of V34 —
 *  Registration decisions. For a registration decision entity_id = request_id. */
@Entity
@Table(name = "approval_history")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@EqualsAndHashCode(callSuper = false)
public class ApprovalHistory extends BaseAuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "approval_id")
    private Long approvalId;

    /** Job | Offer | Registration. */
    @Column(name = "entity_type", nullable = false, length = 20)
    private String entityType;

    @Column(name = "entity_id", nullable = false)
    private Long entityId;

    @Column(name = "approval_stage", nullable = false, length = 50)
    private String approvalStage;

    @Column(name = "approver_id", nullable = false)
    private Long approverId;

    /** Approved | Rejected | Pending. */
    @Column(name = "decision", nullable = false, length = 20)
    private String decision;

    @Column(name = "comments", length = 500)
    private String comments;

    @Column(name = "action_date")
    private LocalDateTime actionDate;
}
