-- user_role: app_user <-> role, many-to-many
CREATE TABLE user_role
(
    user_role_id  BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id       BIGINT   NOT NULL,
    role_id       INT      NOT NULL,
    created_date  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by    BIGINT   NULL,
    modified_date DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
    modified_by   BIGINT   NULL,
    is_active     BOOLEAN  NOT NULL DEFAULT TRUE,
    CONSTRAINT uq_user_role_user_role UNIQUE (user_id, role_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE user_role ADD CONSTRAINT fk_user_role_user        FOREIGN KEY (user_id)     REFERENCES app_user(user_id);
ALTER TABLE user_role ADD CONSTRAINT fk_user_role_role        FOREIGN KEY (role_id)     REFERENCES role(role_id);
ALTER TABLE user_role ADD CONSTRAINT fk_user_role_created_by  FOREIGN KEY (created_by)  REFERENCES app_user(user_id);
ALTER TABLE user_role ADD CONSTRAINT fk_user_role_modified_by FOREIGN KEY (modified_by) REFERENCES app_user(user_id);
