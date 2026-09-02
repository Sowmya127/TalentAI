-- ai_match_detail: 1:M per application, preserving a full scoring
-- history for audit (FR-AI-10) rather than overwriting on each re-run.
CREATE TABLE ai_match_detail
(
    match_detail_id    BIGINT AUTO_INCREMENT PRIMARY KEY,
    application_id       BIGINT       NOT NULL,
    overall_score           DECIMAL(5,2) NOT NULL,
    skills_score               DECIMAL(5,2) NULL,
    experience_score              DECIMAL(5,2) NULL,
    education_score                  DECIMAL(5,2) NULL,
    matched_skills                      TEXT         NULL,
    missing_skills                         TEXT         NULL,
    generated_date                            DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_date                                 DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by                                     BIGINT       NULL,
    modified_date                                     DATETIME     NULL ON UPDATE CURRENT_TIMESTAMP,
    modified_by                                         BIGINT       NULL,
    is_active                                             BOOLEAN      NOT NULL DEFAULT TRUE,
    CONSTRAINT ck_ai_match_detail_overall_score CHECK (overall_score BETWEEN 0 AND 100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE ai_match_detail ADD CONSTRAINT fk_ai_match_detail_application  FOREIGN KEY (application_id) REFERENCES application(application_id);
ALTER TABLE ai_match_detail ADD CONSTRAINT fk_ai_match_detail_created_by   FOREIGN KEY (created_by)     REFERENCES app_user(user_id);
ALTER TABLE ai_match_detail ADD CONSTRAINT fk_ai_match_detail_modified_by  FOREIGN KEY (modified_by)    REFERENCES app_user(user_id);
