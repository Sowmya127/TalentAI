package com.talentai.common.entity;

import jakarta.persistence.Column;
import jakarta.persistence.MappedSuperclass;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import java.time.LocalDateTime;

/**
 * created_date/modified_date are owned by the database (DEFAULT
 * CURRENT_TIMESTAMP / ON UPDATE CURRENT_TIMESTAMP on every table) and
 * are therefore read-only from the JPA side. created_by/modified_by
 * and is_active are application-managed.
 */
@MappedSuperclass
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
public abstract class BaseAuditableEntity {

    @Column(name = "created_date", insertable = false, updatable = false)
    private LocalDateTime createdDate;

    @Column(name = "created_by")
    private Long createdBy;

    @Column(name = "modified_date", insertable = false, updatable = false)
    private LocalDateTime modifiedDate;

    @Column(name = "modified_by")
    private Long modifiedBy;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;
}
