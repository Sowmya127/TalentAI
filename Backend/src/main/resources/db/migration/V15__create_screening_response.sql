-- screening_response: per-application answers to screening_question
CREATE TABLE screening_response
(
    response_id     BIGINT AUTO_INCREMENT PRIMARY KEY,
    application_id  BIGINT      NOT NULL,
    question_id     BIGINT      NOT NULL,
    answer_text     VARCHAR(500) NULL,
    result_status   VARCHAR(20) NOT NULL DEFAULT 'NotEvaluated',
    created_date    DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by      BIGINT      NULL,
    modified_date   DATETIME    NULL ON UPDATE CURRENT_TIMESTAMP,
    modified_by     BIGINT      NULL,
    is_active        BOOLEAN     NOT NULL DEFAULT TRUE,
    CONSTRAINT uq_screening_response_app_question UNIQUE (application_id, question_id),
    CONSTRAINT ck_screening_response_result CHECK (result_status IN ('Pass','Fail','NotEvaluated'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE screening_response ADD CONSTRAINT fk_screening_response_application FOREIGN KEY (application_id) REFERENCES application(application_id);
ALTER TABLE screening_response ADD CONSTRAINT fk_screening_response_question    FOREIGN KEY (question_id)    REFERENCES screening_question(question_id);
ALTER TABLE screening_response ADD CONSTRAINT fk_screening_response_created_by  FOREIGN KEY (created_by)     REFERENCES app_user(user_id);
ALTER TABLE screening_response ADD CONSTRAINT fk_screening_response_modified_by FOREIGN KEY (modified_by)    REFERENCES app_user(user_id);
