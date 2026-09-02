-- work_experience: one row per past job on a candidate's history
CREATE TABLE work_experience
(
    experience_id    BIGINT AUTO_INCREMENT PRIMARY KEY,
    candidate_id     BIGINT       NOT NULL,
    company_name     VARCHAR(150) NOT NULL,
    designation      VARCHAR(100) NULL,
    start_date       DATE         NULL,
    end_date         DATE         NULL,
    responsibilities TEXT         NULL,
    created_date     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by       BIGINT       NULL,
    modified_date    DATETIME     NULL ON UPDATE CURRENT_TIMESTAMP,
    modified_by      BIGINT       NULL,
    is_active         BOOLEAN      NOT NULL DEFAULT TRUE,
    CONSTRAINT ck_work_experience_dates CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE work_experience ADD CONSTRAINT fk_work_experience_candidate   FOREIGN KEY (candidate_id) REFERENCES candidate(candidate_id);
ALTER TABLE work_experience ADD CONSTRAINT fk_work_experience_created_by  FOREIGN KEY (created_by)   REFERENCES app_user(user_id);
ALTER TABLE work_experience ADD CONSTRAINT fk_work_experience_modified_by FOREIGN KEY (modified_by)  REFERENCES app_user(user_id);
