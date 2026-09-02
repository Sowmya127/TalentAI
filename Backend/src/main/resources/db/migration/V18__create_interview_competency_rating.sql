-- interview_competency_rating: configurable rubric (FR-INT-05)
CREATE TABLE interview_competency_rating
(
    competency_rating_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    feedback_id            BIGINT      NOT NULL,
    competency_name          VARCHAR(80) NOT NULL,
    rating                     SMALLINT    NOT NULL,
    created_date                 DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by                     BIGINT      NULL,
    modified_date                     DATETIME    NULL ON UPDATE CURRENT_TIMESTAMP,
    modified_by                         BIGINT      NULL,
    is_active                             BOOLEAN     NOT NULL DEFAULT TRUE,
    CONSTRAINT uq_interview_competency_rating_feedback_competency UNIQUE (feedback_id, competency_name),
    CONSTRAINT ck_interview_competency_rating_rating CHECK (rating BETWEEN 1 AND 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE interview_competency_rating ADD CONSTRAINT fk_icr_feedback     FOREIGN KEY (feedback_id) REFERENCES interview_feedback(feedback_id);
ALTER TABLE interview_competency_rating ADD CONSTRAINT fk_icr_created_by  FOREIGN KEY (created_by)  REFERENCES app_user(user_id);
ALTER TABLE interview_competency_rating ADD CONSTRAINT fk_icr_modified_by FOREIGN KEY (modified_by) REFERENCES app_user(user_id);
