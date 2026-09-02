-- screening_question: per-job (BRD Phase 5 / FR-10)
CREATE TABLE screening_question
(
    question_id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    job_id                BIGINT        NOT NULL,
    question_text          VARCHAR(500)  NOT NULL,
    question_type            VARCHAR(20)   NOT NULL,
    mandatory_flag             BOOLEAN       NOT NULL DEFAULT TRUE,
    disqualifying_answer         VARCHAR(200)  NULL,
    display_order                  INT           NULL,
    created_date                     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by                         BIGINT        NULL,
    modified_date                         DATETIME      NULL ON UPDATE CURRENT_TIMESTAMP,
    modified_by                             BIGINT        NULL,
    is_active                                 BOOLEAN       NOT NULL DEFAULT TRUE,
    CONSTRAINT ck_screening_question_type CHECK (question_type IN ('YesNo','MultipleChoice','FreeText','Numeric'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE screening_question ADD CONSTRAINT fk_screening_question_job         FOREIGN KEY (job_id)     REFERENCES job(job_id);
ALTER TABLE screening_question ADD CONSTRAINT fk_screening_question_created_by  FOREIGN KEY (created_by) REFERENCES app_user(user_id);
ALTER TABLE screening_question ADD CONSTRAINT fk_screening_question_modified_by FOREIGN KEY (modified_by) REFERENCES app_user(user_id);
