-- approval_history: polymorphic (job or offer approval chains,
-- FR-REQ-02, FR-OFF-02). entity_id intentionally carries no FK since
-- it points at either job or offer depending on entity_type -- the
-- service layer is responsible for validity, same as audit_log.
CREATE TABLE approval_history
(
    approval_id     BIGINT AUTO_INCREMENT PRIMARY KEY,
    entity_type       VARCHAR(20)  NOT NULL,
    entity_id           BIGINT       NOT NULL,
    approval_stage         VARCHAR(50)  NOT NULL,
    approver_id               BIGINT       NOT NULL,
    decision                    VARCHAR(20)  NOT NULL DEFAULT 'Pending',
    comments                       VARCHAR(500) NULL,
    action_date                       DATETIME     NULL,
    created_date                         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by                             BIGINT       NULL,
    modified_date                             DATETIME     NULL ON UPDATE CURRENT_TIMESTAMP,
    modified_by                                 BIGINT       NULL,
    is_active                                     BOOLEAN      NOT NULL DEFAULT TRUE,
    CONSTRAINT ck_approval_history_entity_type CHECK (entity_type IN ('Job','Offer')),
    CONSTRAINT ck_approval_history_decision CHECK (decision IN ('Approved','Rejected','Pending'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE approval_history ADD CONSTRAINT fk_approval_history_approver     FOREIGN KEY (approver_id) REFERENCES app_user(user_id);
ALTER TABLE approval_history ADD CONSTRAINT fk_approval_history_created_by   FOREIGN KEY (created_by)  REFERENCES app_user(user_id);
ALTER TABLE approval_history ADD CONSTRAINT fk_approval_history_modified_by  FOREIGN KEY (modified_by) REFERENCES app_user(user_id);
