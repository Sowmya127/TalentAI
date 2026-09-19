-- Role-driven self-registration policy (data-driven; no hard-coded role logic).
ALTER TABLE role
    ADD COLUMN self_registerable BOOLEAN NOT NULL DEFAULT FALSE AFTER description,
    ADD COLUMN requires_approval BOOLEAN NOT NULL DEFAULT TRUE  AFTER self_registerable,
    ADD COLUMN auto_activate     BOOLEAN NOT NULL DEFAULT FALSE AFTER requires_approval;

UPDATE role SET self_registerable = TRUE,  requires_approval = FALSE, auto_activate = TRUE
    WHERE role_name = 'Candidate';
UPDATE role SET self_registerable = TRUE,  requires_approval = TRUE,  auto_activate = FALSE
    WHERE role_name IN ('Recruiter', 'Hiring Manager', 'Interviewer', 'HR Admin');
UPDATE role SET self_registerable = FALSE, requires_approval = TRUE,  auto_activate = FALSE
    WHERE role_name = 'System Admin';
