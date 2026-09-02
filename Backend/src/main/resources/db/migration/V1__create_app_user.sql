-- app_user: the login account. Named app_user rather than "user" to
-- avoid any ambiguity with MySQL's own mysql.user system table -- the
-- JPA entity class itself is still named User (see @Table override).
CREATE TABLE app_user
(
    user_id                 BIGINT AUTO_INCREMENT PRIMARY KEY,
    first_name              VARCHAR(50)  NOT NULL,
    last_name               VARCHAR(50)  NOT NULL,
    email                   VARCHAR(150) NOT NULL,
    password_hash           VARCHAR(255) NOT NULL,
    phone_number            VARCHAR(20)  NULL,
    user_status             VARCHAR(20)  NOT NULL DEFAULT 'Active',
    external_idp_subject_id VARCHAR(255) NULL,  -- SAML/OIDC subject identifier (FR-ADM-02)
    created_date            DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by              BIGINT       NULL,
    modified_date           DATETIME     NULL ON UPDATE CURRENT_TIMESTAMP,
    modified_by             BIGINT       NULL,
    is_active                BOOLEAN      NOT NULL DEFAULT TRUE,
    CONSTRAINT uq_user_email UNIQUE (email),
    CONSTRAINT uq_user_external_idp_subject_id UNIQUE (external_idp_subject_id),
    CONSTRAINT ck_user_user_status CHECK (user_status IN ('Active','Inactive','Suspended'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Self-referencing audit columns: added after the table exists.
ALTER TABLE app_user ADD CONSTRAINT fk_user_created_by  FOREIGN KEY (created_by)  REFERENCES app_user(user_id);
ALTER TABLE app_user ADD CONSTRAINT fk_user_modified_by FOREIGN KEY (modified_by) REFERENCES app_user(user_id);
