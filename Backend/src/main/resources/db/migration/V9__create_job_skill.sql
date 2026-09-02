-- job_skill: job <-> skill, many-to-many
CREATE TABLE job_skill
(
    job_skill_id   BIGINT AUTO_INCREMENT PRIMARY KEY,
    job_id         BIGINT       NOT NULL,
    skill_id       INT          NOT NULL,
    mandatory_flag BOOLEAN      NOT NULL DEFAULT TRUE,
    weight         DECIMAL(5,2) NULL,  -- configurable scoring weight 0-100 (FR-AI-04)
    created_date   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by     BIGINT       NULL,
    modified_date  DATETIME     NULL ON UPDATE CURRENT_TIMESTAMP,
    modified_by    BIGINT       NULL,
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    CONSTRAINT uq_job_skill_job_skill UNIQUE (job_id, skill_id),
    CONSTRAINT ck_job_skill_weight CHECK (weight IS NULL OR weight BETWEEN 0 AND 100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE job_skill ADD CONSTRAINT fk_job_skill_job         FOREIGN KEY (job_id)      REFERENCES job(job_id);
ALTER TABLE job_skill ADD CONSTRAINT fk_job_skill_skill       FOREIGN KEY (skill_id)    REFERENCES skill(skill_id);
ALTER TABLE job_skill ADD CONSTRAINT fk_job_skill_created_by  FOREIGN KEY (created_by)  REFERENCES app_user(user_id);
ALTER TABLE job_skill ADD CONSTRAINT fk_job_skill_modified_by FOREIGN KEY (modified_by) REFERENCES app_user(user_id);
