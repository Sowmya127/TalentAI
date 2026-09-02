package com.talentai.candidate.entity;

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
import java.time.LocalDate;

@Entity
@Table(name = "candidate")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@EqualsAndHashCode(callSuper = false)
public class Candidate extends BaseAuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "candidate_id")
    private Long candidateId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Column(name = "gender", length = 20)
    private String gender;

    @Column(name = "current_location", length = 100)
    private String currentLocation;

    @Column(name = "total_experience", nullable = false)
    private BigDecimal totalExperience;

    @Column(name = "resume_url", length = 500)
    private String resumeUrl;

    @Column(name = "resume_score")
    private BigDecimal resumeScore;

    @Column(name = "notice_period_days")
    private Integer noticePeriodDays;

    @Column(name = "salary_expectation")
    private BigDecimal salaryExpectation;
}
