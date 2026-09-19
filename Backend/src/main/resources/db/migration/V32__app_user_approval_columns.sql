-- Approval / verification snapshot on the login account. Existing rows default
-- to 'APPROVED' so every current account stays loginable (no regression).
ALTER TABLE app_user
    ADD COLUMN approval_status         VARCHAR(20)  NOT NULL DEFAULT 'APPROVED'     AFTER user_status,
    ADD COLUMN requested_role_id       INT          NULL                            AFTER approval_status,
    ADD COLUMN company_id              BIGINT       NULL                            AFTER requested_role_id,
    ADD COLUMN organization_email      VARCHAR(150) NULL                            AFTER company_id,
    ADD COLUMN verification_status     VARCHAR(20)  NOT NULL DEFAULT 'NotRequired'  AFTER organization_email,
    ADD COLUMN approved_by             BIGINT       NULL                            AFTER verification_status,
    ADD COLUMN approved_timestamp      DATETIME     NULL                            AFTER approved_by,
    ADD COLUMN rejection_reason        VARCHAR(500) NULL                            AFTER approved_timestamp,
    ADD COLUMN last_reviewed_timestamp DATETIME     NULL                            AFTER rejection_reason,
    ADD CONSTRAINT ck_user_approval_status
        CHECK (approval_status IN ('NOT_REQUIRED', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED')),
    ADD CONSTRAINT ck_user_verification_status
        CHECK (verification_status IN ('NotRequired', 'Pending', 'Verified', 'Failed'));

ALTER TABLE app_user ADD CONSTRAINT fk_user_requested_role FOREIGN KEY (requested_role_id) REFERENCES role(role_id);
ALTER TABLE app_user ADD CONSTRAINT fk_user_company        FOREIGN KEY (company_id)        REFERENCES company(company_id);
ALTER TABLE app_user ADD CONSTRAINT fk_user_approved_by    FOREIGN KEY (approved_by)       REFERENCES app_user(user_id);

CREATE INDEX ix_user_approval_status ON app_user (approval_status);
