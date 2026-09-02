-- interview_feedback: 1:M per interview (panel interviews -- one row
-- per interviewer, FR-INT-06). Per-competency ratings live in
-- interview_competency_rating (V18), not fixed columns here.
CREATE TABLE interview_feedback
(
    feedback_id      BIGINT AUTO_INCREMENT PRIMARY KEY,
    interview_id      BIGINT      NOT NULL,
    interviewer_id      BIGINT      NOT NULL,
    recommendation        VARCHAR(20) NULL,
    comments                TEXT        NULL,
    created_date              DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by                  BIGINT      NULL,
    modified_date                  DATETIME    NULL ON UPDATE CURRENT_TIMESTAMP,
    modified_by                      BIGINT      NULL,
    is_active                          BOOLEAN     NOT NULL DEFAULT TRUE,
    CONSTRAINT uq_interview_feedback_interview_interviewer UNIQUE (interview_id, interviewer_id),
    CONSTRAINT ck_interview_feedback_recommendation CHECK (recommendation IS NULL OR recommendation IN ('Strong Hire','Hire','Hold','Reject'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE interview_feedback ADD CONSTRAINT fk_interview_feedback_interview    FOREIGN KEY (interview_id)   REFERENCES interview(interview_id);
ALTER TABLE interview_feedback ADD CONSTRAINT fk_interview_feedback_interviewer  FOREIGN KEY (interviewer_id) REFERENCES app_user(user_id);
ALTER TABLE interview_feedback ADD CONSTRAINT fk_interview_feedback_created_by   FOREIGN KEY (created_by)     REFERENCES app_user(user_id);
ALTER TABLE interview_feedback ADD CONSTRAINT fk_interview_feedback_modified_by  FOREIGN KEY (modified_by)    REFERENCES app_user(user_id);
