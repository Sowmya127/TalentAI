-- candidate: 1:1 with app_user
CREATE TABLE candidate
(
    candidate_id       BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id            BIGINT        NOT NULL,
    date_of_birth      DATE          NULL,
    gender             VARCHAR(20)   NULL,
    current_location   VARCHAR(100)  NULL,
    total_experience   DECIMAL(4,1)  NOT NULL DEFAULT 0,
    resume_url         VARCHAR(500)  NULL,
    resume_score       DECIMAL(5,2)  NULL,
    notice_period_days INT           NULL,
    salary_expectation DECIMAL(12,2) NULL,
    created_date       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by         BIGINT        NULL,
    modified_date      DATETIME      NULL ON UPDATE CURRENT_TIMESTAMP,
    modified_by        BIGINT        NULL,
    is_active           BOOLEAN       NOT NULL DEFAULT TRUE,
    CONSTRAINT uq_candidate_user UNIQUE (user_id),
    CONSTRAINT ck_candidate_total_experience CHECK (total_experience >= 0),
    CONSTRAINT ck_candidate_resume_score CHECK (resume_score IS NULL OR resume_score BETWEEN 0 AND 100),
    CONSTRAINT ck_candidate_notice_period CHECK (notice_period_days IS NULL OR notice_period_days >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE candidate ADD CONSTRAINT fk_candidate_user        FOREIGN KEY (user_id)     REFERENCES app_user(user_id);
ALTER TABLE candidate ADD CONSTRAINT fk_candidate_created_by  FOREIGN KEY (created_by)  REFERENCES app_user(user_id);
ALTER TABLE candidate ADD CONSTRAINT fk_candidate_modified_by FOREIGN KEY (modified_by) REFERENCES app_user(user_id);
