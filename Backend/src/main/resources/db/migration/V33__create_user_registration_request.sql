-- user_registration_request: the reviewable self-registration submission and its outcome.
CREATE TABLE user_registration_request
(
    request_id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id            BIGINT       NOT NULL,
    requested_role_id  INT          NOT NULL,
    company_id         BIGINT       NULL,
    organization_email VARCHAR(150) NULL,
    status             VARCHAR(20)  NOT NULL DEFAULT 'PENDING_APPROVAL',
    submitted_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_by        BIGINT       NULL,
    reviewed_at        DATETIME     NULL,
    rejection_reason   VARCHAR(500) NULL,
    created_date       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by         BIGINT       NULL,
    modified_date      DATETIME     NULL ON UPDATE CURRENT_TIMESTAMP,
    modified_by        BIGINT       NULL,
    is_active          BOOLEAN      NOT NULL DEFAULT TRUE,
    CONSTRAINT uq_reg_request_user UNIQUE (user_id),
    CONSTRAINT ck_reg_request_status CHECK (status IN ('PENDING_APPROVAL', 'APPROVED', 'REJECTED')),
    CONSTRAINT fk_reg_request_user     FOREIGN KEY (user_id)           REFERENCES app_user(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_reg_request_role     FOREIGN KEY (requested_role_id) REFERENCES role(role_id),
    CONSTRAINT fk_reg_request_company  FOREIGN KEY (company_id)        REFERENCES company(company_id),
    CONSTRAINT fk_reg_request_reviewer FOREIGN KEY (reviewed_by)       REFERENCES app_user(user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX ix_reg_request_status ON user_registration_request (status);
