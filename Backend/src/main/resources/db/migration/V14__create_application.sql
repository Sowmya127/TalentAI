-- application: candidate <-> job, the hub of the recruitment pipeline
CREATE TABLE application
(
    application_id      BIGINT AUTO_INCREMENT PRIMARY KEY,
    candidate_id         BIGINT       NOT NULL,
    job_id                 BIGINT       NOT NULL,
    applied_date             DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    application_status         VARCHAR(30)  NOT NULL DEFAULT 'Applied',
    match_score                   DECIMAL(5,2) NULL,
    source_channel                   VARCHAR(50)  NULL,
    consent_given                       BOOLEAN      NOT NULL DEFAULT FALSE,
    consent_date                           DATETIME     NULL,
    consent_version                           VARCHAR(20)  NULL,
    created_date                                 DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by                                     BIGINT       NULL,
    modified_date                                     DATETIME     NULL ON UPDATE CURRENT_TIMESTAMP,
    modified_by                                         BIGINT       NULL,
    is_active                                             BOOLEAN      NOT NULL DEFAULT TRUE,
    -- BR-016 note: this hard-blocks duplicate applications outright.
    -- Business rules allow a configurable exception; move that check
    -- into the service layer if it's needed rather than relaxing this.
    CONSTRAINT uq_application_candidate_job UNIQUE (candidate_id, job_id),
    CONSTRAINT ck_application_status CHECK (application_status IN (
        'Applied','Under Review','Shortlisted','Interview Scheduled',
        'Interview Completed','Selected','Rejected','Offer Sent','Hired','Withdrawn')),
    CONSTRAINT ck_application_match_score CHECK (match_score IS NULL OR match_score BETWEEN 0 AND 100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE application ADD CONSTRAINT fk_application_candidate   FOREIGN KEY (candidate_id) REFERENCES candidate(candidate_id);
ALTER TABLE application ADD CONSTRAINT fk_application_job         FOREIGN KEY (job_id)       REFERENCES job(job_id);
ALTER TABLE application ADD CONSTRAINT fk_application_created_by  FOREIGN KEY (created_by)   REFERENCES app_user(user_id);
ALTER TABLE application ADD CONSTRAINT fk_application_modified_by FOREIGN KEY (modified_by)  REFERENCES app_user(user_id);
