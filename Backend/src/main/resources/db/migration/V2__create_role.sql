-- Role: named permission set (Recruiter, Hiring Manager, etc.)
CREATE TABLE role
(
    role_id      INT AUTO_INCREMENT PRIMARY KEY,
    role_name    VARCHAR(50)  NOT NULL,
    description  VARCHAR(200) NULL,
    created_date DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by   BIGINT       NULL,
    modified_date DATETIME    NULL ON UPDATE CURRENT_TIMESTAMP,
    modified_by  BIGINT       NULL,
    is_active    BOOLEAN      NOT NULL DEFAULT TRUE,
    CONSTRAINT uq_role_role_name UNIQUE (role_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE role ADD CONSTRAINT fk_role_created_by  FOREIGN KEY (created_by)  REFERENCES app_user(user_id);
ALTER TABLE role ADD CONSTRAINT fk_role_modified_by FOREIGN KEY (modified_by) REFERENCES app_user(user_id);
