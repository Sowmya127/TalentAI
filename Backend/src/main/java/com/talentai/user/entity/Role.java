package com.talentai.user.entity;

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

@Entity
@Table(name = "role")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@EqualsAndHashCode(callSuper = false)
public class Role extends BaseAuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "role_id")
    private Integer roleId;

    @Column(name = "role_name", nullable = false, unique = true, length = 50)
    private String roleName;

    @Column(name = "description", length = 200)
    private String description;

    // --- Self-registration policy (V30) ----------------------------------

    @Column(name = "self_registerable", nullable = false)
    @lombok.Builder.Default
    private Boolean selfRegisterable = false;

    @Column(name = "requires_approval", nullable = false)
    @lombok.Builder.Default
    private Boolean requiresApproval = true;

    @Column(name = "auto_activate", nullable = false)
    @lombok.Builder.Default
    private Boolean autoActivate = false;
}
