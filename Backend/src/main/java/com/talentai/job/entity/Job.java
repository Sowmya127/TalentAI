package com.talentai.job.entity;

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
@Table(name = "job")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@EqualsAndHashCode(callSuper = false)
public class Job extends BaseAuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "job_id")
    private Long jobId;

    @Column(name = "title", nullable = false, length = 150)
    private String title;

    @Column(name = "description")
    private String description;

    @Column(name = "department", length = 80)
    private String department;

    @Column(name = "cost_center", length = 50)
    private String costCenter;

    @Column(name = "headcount", nullable = false)
    private Integer headcount;

    @Column(name = "business_justification")
    private String businessJustification;

    @Column(name = "location", length = 100)
    private String location;

    @Column(name = "employment_type", length = 30)
    private String employmentType;

    @Column(name = "experience_required_min")
    private BigDecimal experienceRequiredMin;

    @Column(name = "experience_required_max")
    private BigDecimal experienceRequiredMax;

    @Column(name = "salary_min")
    private BigDecimal salaryMin;

    @Column(name = "salary_max")
    private BigDecimal salaryMax;

    @Column(name = "job_status", nullable = false, length = 20)
    private String jobStatus;

    @Column(name = "recruiter_id", nullable = false)
    private Long recruiterId;

    @Column(name = "hiring_manager_id")
    private Long hiringManagerId;

    @Column(name = "target_hiring_date")
    private LocalDate targetHiringDate;
}
