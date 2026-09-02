-- education: one row per degree a candidate lists
CREATE TABLE education
(
    education_id    BIGINT AUTO_INCREMENT PRIMARY KEY,
    candidate_id    BIGINT       NOT NULL,
    degree          VARCHAR(100) NOT NULL,
    institution     VARCHAR(150) NULL,
    graduation_year SMALLINT     NULL,
    percentage      DECIMAL(5,2) NULL,
    created_date    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by      BIGINT       NULL,
    modified_date   DATETIME     NULL ON UPDATE CURRENT_TIMESTAMP,
    modified_by     BIGINT       NULL,
    is_active        BOOLEAN      NOT NULL DEFAULT TRUE,
    CONSTRAINT ck_education_graduation_year CHECK (graduation_year IS NULL OR graduation_year BETWEEN 1950 AND 2100),
    CONSTRAINT ck_education_percentage CHECK (percentage IS NULL OR percentage BETWEEN 0 AND 100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE education ADD CONSTRAINT fk_education_candidate   FOREIGN KEY (candidate_id) REFERENCES candidate(candidate_id);
ALTER TABLE education ADD CONSTRAINT fk_education_created_by  FOREIGN KEY (created_by)   REFERENCES app_user(user_id);
ALTER TABLE education ADD CONSTRAINT fk_education_modified_by FOREIGN KEY (modified_by)  REFERENCES app_user(user_id);
