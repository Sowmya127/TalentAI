-- audit_log: append-only by convention. Its own audit columns are
-- structurally present per spec but should never be written to by
-- application code -- see V28 for the triggers that populate this table,
-- and AuditService in the Java codebase for the app_user exception
-- (the one audited table with no DB trigger, since app_user itself
-- has no earlier table to have referenced when V28 was written).
CREATE TABLE audit_log
(
    audit_id       BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id          BIGINT      NULL,  -- actor; nullable for system-generated events
    action_type        VARCHAR(30) NOT NULL,
    entity_type           VARCHAR(50) NOT NULL,
    entity_id                BIGINT      NULL,
    old_value                   JSON        NULL,
    new_value                      JSON        NULL,
    action_date                       DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_date                         DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by                             BIGINT      NULL,
    modified_date                             DATETIME    NULL ON UPDATE CURRENT_TIMESTAMP,
    modified_by                                 BIGINT      NULL,
    is_active                                     BOOLEAN     NOT NULL DEFAULT TRUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE audit_log ADD CONSTRAINT fk_audit_log_user        FOREIGN KEY (user_id)    REFERENCES app_user(user_id);
ALTER TABLE audit_log ADD CONSTRAINT fk_audit_log_created_by  FOREIGN KEY (created_by) REFERENCES app_user(user_id);
ALTER TABLE audit_log ADD CONSTRAINT fk_audit_log_modified_by FOREIGN KEY (modified_by) REFERENCES app_user(user_id);
