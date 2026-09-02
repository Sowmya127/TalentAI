-- job: requisition/job posting
CREATE TABLE job
(
    job_id                   BIGINT AUTO_INCREMENT PRIMARY KEY,
    title                    VARCHAR(150)  NOT NULL,
    description              TEXT          NULL,
    department               VARCHAR(80)   NULL,
    cost_center              VARCHAR(50)   NULL,
    headcount                INT           NOT NULL DEFAULT 1,
    business_justification   TEXT          NULL,
    location                 VARCHAR(100)  NULL,
    employment_type          VARCHAR(30)   NULL,
    experience_required_min  DECIMAL(3,1)  NULL,
    experience_required_max  DECIMAL(3,1)  NULL,
    salary_min               DECIMAL(12,2) NULL,
    salary_max               DECIMAL(12,2) NULL,
    job_status                VARCHAR(20)   NOT NULL DEFAULT 'Draft',
    recruiter_id               BIGINT        NOT NULL,
    hiring_manager_id           BIGINT        NULL,
    target_hiring_date           DATE          NULL,
    created_date                   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by                       BIGINT        NULL,
    modified_date                       DATETIME      NULL ON UPDATE CURRENT_TIMESTAMP,
    modified_by                           BIGINT        NULL,
    is_active                               BOOLEAN       NOT NULL DEFAULT TRUE,
    CONSTRAINT ck_job_job_status CHECK (job_status IN ('Draft','Pending Approval','Approved','Open','On Hold','Closed','Cancelled')),
    CONSTRAINT ck_job_salary_range CHECK (salary_max IS NULL OR salary_min IS NULL OR salary_max >= salary_min),
    CONSTRAINT ck_job_experience_range CHECK (experience_required_max IS NULL OR experience_required_min IS NULL OR experience_required_max >= experience_required_min),
    CONSTRAINT ck_job_headcount CHECK (headcount >= 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE job ADD CONSTRAINT fk_job_recruiter       FOREIGN KEY (recruiter_id)      REFERENCES app_user(user_id);
ALTER TABLE job ADD CONSTRAINT fk_job_hiring_manager  FOREIGN KEY (hiring_manager_id) REFERENCES app_user(user_id);
ALTER TABLE job ADD CONSTRAINT fk_job_created_by      FOREIGN KEY (created_by)        REFERENCES app_user(user_id);
ALTER TABLE job ADD CONSTRAINT fk_job_modified_by     FOREIGN KEY (modified_by)       REFERENCES app_user(user_id);
