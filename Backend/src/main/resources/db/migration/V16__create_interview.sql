-- interview
CREATE TABLE interview
(
    interview_id     BIGINT AUTO_INCREMENT PRIMARY KEY,
    application_id     BIGINT      NOT NULL,
    interviewer_id       BIGINT      NOT NULL,
    interview_date         DATETIME    NOT NULL,
    interview_type           VARCHAR(30) NULL,
    interview_mode             VARCHAR(30) NULL,
    interview_status             VARCHAR(20) NOT NULL DEFAULT 'Scheduled',
    created_date                   DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by                       BIGINT      NULL,
    modified_date                       DATETIME    NULL ON UPDATE CURRENT_TIMESTAMP,
    modified_by                           BIGINT      NULL,
    is_active                               BOOLEAN     NOT NULL DEFAULT TRUE,
    CONSTRAINT ck_interview_status CHECK (interview_status IN ('Scheduled','Rescheduled','Completed','Cancelled'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE interview ADD CONSTRAINT fk_interview_application  FOREIGN KEY (application_id) REFERENCES application(application_id);
ALTER TABLE interview ADD CONSTRAINT fk_interview_interviewer  FOREIGN KEY (interviewer_id) REFERENCES app_user(user_id);
ALTER TABLE interview ADD CONSTRAINT fk_interview_created_by   FOREIGN KEY (created_by)     REFERENCES app_user(user_id);
ALTER TABLE interview ADD CONSTRAINT fk_interview_modified_by  FOREIGN KEY (modified_by)    REFERENCES app_user(user_id);
