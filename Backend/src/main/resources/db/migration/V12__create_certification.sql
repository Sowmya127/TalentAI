-- certification: one row per professional certification a candidate holds
CREATE TABLE certification
(
    certification_id   BIGINT AUTO_INCREMENT PRIMARY KEY,
    candidate_id        BIGINT       NOT NULL,
    certification_name   VARCHAR(150) NOT NULL,
    issued_by             VARCHAR(150) NULL,
    issue_date             DATE         NULL,
    created_date             DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by                 BIGINT       NULL,
    modified_date                 DATETIME     NULL ON UPDATE CURRENT_TIMESTAMP,
    modified_by                     BIGINT       NULL,
    is_active                         BOOLEAN      NOT NULL DEFAULT TRUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE certification ADD CONSTRAINT fk_certification_candidate   FOREIGN KEY (candidate_id) REFERENCES candidate(candidate_id);
ALTER TABLE certification ADD CONSTRAINT fk_certification_created_by  FOREIGN KEY (created_by)   REFERENCES app_user(user_id);
ALTER TABLE certification ADD CONSTRAINT fk_certification_modified_by FOREIGN KEY (modified_by)  REFERENCES app_user(user_id);
