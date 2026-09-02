-- offer: 0..1 per application
CREATE TABLE offer
(
    offer_id             BIGINT AUTO_INCREMENT PRIMARY KEY,
    application_id         BIGINT        NOT NULL,
    salary                   DECIMAL(12,2) NOT NULL,
    joining_date               DATE          NULL,
    offer_status                 VARCHAR(20)   NOT NULL DEFAULT 'Draft',
    approved_by                    BIGINT        NULL,
    decline_reason                    VARCHAR(300)  NULL,
    signed_document_url                  VARCHAR(500)  NULL,
    created_date                            DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by                                BIGINT        NULL,
    modified_date                                DATETIME      NULL ON UPDATE CURRENT_TIMESTAMP,
    modified_by                                    BIGINT        NULL,
    is_active                                        BOOLEAN       NOT NULL DEFAULT TRUE,
    CONSTRAINT uq_offer_application UNIQUE (application_id),
    CONSTRAINT ck_offer_status CHECK (offer_status IN ('Draft','Pending Approval','Sent','Accepted','Declined','Expired','Rescinded')),
    CONSTRAINT ck_offer_salary CHECK (salary > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE offer ADD CONSTRAINT fk_offer_application  FOREIGN KEY (application_id) REFERENCES application(application_id);
ALTER TABLE offer ADD CONSTRAINT fk_offer_approved_by  FOREIGN KEY (approved_by)    REFERENCES app_user(user_id);
ALTER TABLE offer ADD CONSTRAINT fk_offer_created_by   FOREIGN KEY (created_by)     REFERENCES app_user(user_id);
ALTER TABLE offer ADD CONSTRAINT fk_offer_modified_by  FOREIGN KEY (modified_by)    REFERENCES app_user(user_id);
