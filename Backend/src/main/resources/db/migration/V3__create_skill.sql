-- Skill: master list of skills, shared by candidate_skill and job_skill
CREATE TABLE skill
(
    skill_id      INT AUTO_INCREMENT PRIMARY KEY,
    skill_name    VARCHAR(80) NOT NULL,
    category      VARCHAR(50) NULL,
    created_date  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by    BIGINT      NULL,
    modified_date DATETIME    NULL ON UPDATE CURRENT_TIMESTAMP,
    modified_by   BIGINT      NULL,
    is_active     BOOLEAN     NOT NULL DEFAULT TRUE,
    CONSTRAINT uq_skill_skill_name UNIQUE (skill_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE skill ADD CONSTRAINT fk_skill_created_by  FOREIGN KEY (created_by)  REFERENCES app_user(user_id);
ALTER TABLE skill ADD CONSTRAINT fk_skill_modified_by FOREIGN KEY (modified_by) REFERENCES app_user(user_id);
