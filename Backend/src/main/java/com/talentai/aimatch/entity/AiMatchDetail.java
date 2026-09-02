package com.talentai.aimatch.entity;

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

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "ai_match_detail")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@EqualsAndHashCode(callSuper = false)
public class AiMatchDetail extends BaseAuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "match_detail_id")
    private Long matchDetailId;

    @Column(name = "application_id", nullable = false)
    private Long applicationId;

    @Column(name = "overall_score", nullable = false)
    private BigDecimal overallScore;

    @Column(name = "skills_score")
    private BigDecimal skillsScore;

    @Column(name = "experience_score")
    private BigDecimal experienceScore;

    @Column(name = "education_score")
    private BigDecimal educationScore;

    @Column(name = "matched_skills")
    private String matchedSkills;

    @Column(name = "missing_skills")
    private String missingSkills;

    @Column(name = "generated_date", insertable = false, updatable = false)
    private LocalDateTime generatedDate;
}
