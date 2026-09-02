-- candidate_skill: candidate <-> skill, many-to-many
CREATE TABLE candidate_skill
(
    candidate_skill_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    candidate_id       BIGINT       NOT NULL,
    skill_id           INT          NOT NULL,
    years_experience   DECIMAL(3,1) NOT NULL DEFAULT 0,
    created_date       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by         BIGINT       NULL,
    modified_date      DATETIME     NULL ON UPDATE CURRENT_TIMESTAMP,
    modified_by        BIGINT       NULL,
    is_active           BOOLEAN      NOT NULL DEFAULT TRUE,
    CONSTRAINT uq_candidate_skill_candidate_skill UNIQUE (candidate_id, skill_id),
    CONSTRAINT ck_candidate_skill_years CHECK (years_experience >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE candidate_skill ADD CONSTRAINT fk_candidate_skill_candidate  FOREIGN KEY (candidate_id) REFERENCES candidate(candidate_id);
ALTER TABLE candidate_skill ADD CONSTRAINT fk_candidate_skill_skill      FOREIGN KEY (skill_id)     REFERENCES skill(skill_id);
ALTER TABLE candidate_skill ADD CONSTRAINT fk_candidate_skill_created_by FOREIGN KEY (created_by)   REFERENCES app_user(user_id);
ALTER TABLE candidate_skill ADD CONSTRAINT fk_candidate_skill_modified_by FOREIGN KEY (modified_by) REFERENCES app_user(user_id);
