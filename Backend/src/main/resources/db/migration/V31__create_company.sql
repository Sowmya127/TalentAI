-- company: organization a non-candidate user belongs to; supports email-domain
-- verification during registration approval.
CREATE TABLE company
(
    company_id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    company_name        VARCHAR(150) NOT NULL,
    email_domain        VARCHAR(150) NULL,
    verification_status VARCHAR(20)  NOT NULL DEFAULT 'Pending',
    verified_by         BIGINT       NULL,
    verified_at         DATETIME     NULL,
    created_date        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by          BIGINT       NULL,
    modified_date       DATETIME     NULL ON UPDATE CURRENT_TIMESTAMP,
    modified_by         BIGINT       NULL,
    is_active           BOOLEAN      NOT NULL DEFAULT TRUE,
    CONSTRAINT uq_company_name UNIQUE (company_name),
    CONSTRAINT ck_company_verification CHECK (verification_status IN ('Pending', 'Verified', 'Rejected'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX ix_company_email_domain ON company (email_domain);

ALTER TABLE company ADD CONSTRAINT fk_company_verified_by FOREIGN KEY (verified_by) REFERENCES app_user(user_id);
ALTER TABLE company ADD CONSTRAINT fk_company_created_by  FOREIGN KEY (created_by)  REFERENCES app_user(user_id);
ALTER TABLE company ADD CONSTRAINT fk_company_modified_by FOREIGN KEY (modified_by) REFERENCES app_user(user_id);
