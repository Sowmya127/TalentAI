-- candidate_demographic: DEI self-ID data, kept in its own table because
-- the BRD classifies it "Highly Confidential -- Restricted, Aggregated
-- Reporting Only." Apply row-level access control / column encryption
-- at the application/DB-config layer before production use; this
-- table only provides the structural separation.
CREATE TABLE candidate_demographic
(
    demographic_id     BIGINT AUTO_INCREMENT PRIMARY KEY,
    candidate_id       BIGINT      NOT NULL,
    gender_self_id     VARCHAR(50) NULL,
    ethnicity_self_id  VARCHAR(50) NULL,
    disability_status  VARCHAR(20) NULL,
    veteran_status     VARCHAR(20) NULL,
    consent_given      BOOLEAN     NOT NULL DEFAULT FALSE,
    consent_date       DATETIME    NULL,
    created_date       DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by         BIGINT      NULL,
    modified_date      DATETIME    NULL ON UPDATE CURRENT_TIMESTAMP,
    modified_by        BIGINT      NULL,
    is_active           BOOLEAN     NOT NULL DEFAULT TRUE,
    CONSTRAINT uq_candidate_demographic_candidate UNIQUE (candidate_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE candidate_demographic ADD CONSTRAINT fk_candidate_demographic_candidate   FOREIGN KEY (candidate_id) REFERENCES candidate(candidate_id);
ALTER TABLE candidate_demographic ADD CONSTRAINT fk_candidate_demographic_created_by  FOREIGN KEY (created_by)   REFERENCES app_user(user_id);
ALTER TABLE candidate_demographic ADD CONSTRAINT fk_candidate_demographic_modified_by FOREIGN KEY (modified_by)  REFERENCES app_user(user_id);
