-- Bootstrap system user (created_by = NULL since nothing precedes it)
INSERT INTO app_user (first_name, last_name, email, password_hash, user_status, created_by)
VALUES ('System', 'Administrator', 'system.admin@talentai.local', 'N/A - system account', 'Active', NULL);

SET @system_user_id = LAST_INSERT_ID();
UPDATE app_user SET created_by = @system_user_id WHERE user_id = @system_user_id;

-- Roles
INSERT INTO role (role_name, description, created_by) VALUES
    ('Candidate',      'External job seeker applying for roles',                 @system_user_id),
    ('Recruiter',      'Manages requisitions, sourcing, screening, scheduling',   @system_user_id),
    ('Hiring Manager', 'Owns the role; reviews and interviews candidates',        @system_user_id),
    ('Interviewer',    'Conducts interviews and submits structured feedback',     @system_user_id),
    ('HR Admin',       'Manages offer logistics and onboarding tasks',           @system_user_id),
    ('System Admin',   'Configures workflows, roles, integrations',             @system_user_id);

-- Sample skills
INSERT INTO skill (skill_name, category, created_by) VALUES
    ('Java',                'Technical',  @system_user_id),
    ('Spring Boot',          'Technical',  @system_user_id),
    ('SQL',                    'Technical',  @system_user_id),
    ('AWS',                      'Technical',  @system_user_id),
    ('Kafka',                      'Technical',  @system_user_id),
    ('Communication',                'Functional', @system_user_id),
    ('Project Management',             'Functional', @system_user_id);

-- Sample users (one Recruiter, one Hiring Manager, one Candidate-to-be)
INSERT INTO app_user (first_name, last_name, email, password_hash, user_status, created_by) VALUES
    ('Priya', 'Nair', 'priya.nair@talentai.local', 'placeholder-hash-1', 'Active', @system_user_id),
    ('Arjun', 'Rao',   'arjun.rao@talentai.local',   'placeholder-hash-2', 'Active', @system_user_id),
    ('John',  'Doe',     'john.doe@gmail.com',           'placeholder-hash-3', 'Active', @system_user_id);

SET @recruiter_user_id = (SELECT user_id FROM app_user WHERE email = 'priya.nair@talentai.local');
SET @hm_user_id        = (SELECT user_id FROM app_user WHERE email = 'arjun.rao@talentai.local');
SET @candidate_user_id = (SELECT user_id FROM app_user WHERE email = 'john.doe@gmail.com');

INSERT INTO user_role (user_id, role_id, created_by) VALUES
    (@recruiter_user_id, (SELECT role_id FROM role WHERE role_name = 'Recruiter'),      @system_user_id),
    (@hm_user_id,        (SELECT role_id FROM role WHERE role_name = 'Hiring Manager'), @system_user_id),
    (@candidate_user_id, (SELECT role_id FROM role WHERE role_name = 'Candidate'),      @system_user_id);

-- Sample candidate
INSERT INTO candidate (user_id, current_location, total_experience, resume_url, resume_score, created_by)
VALUES (@candidate_user_id, 'Bengaluru', 6.0, '/files/resumes/john_doe.pdf', 82.5, @system_user_id);

-- Sample job (job_status 'Open' per the corrected FR-REQ-04 status list)
INSERT INTO job (title, description, department, cost_center, headcount, business_justification,
                  location, employment_type, experience_required_min, experience_required_max,
                  salary_min, salary_max, job_status, recruiter_id, hiring_manager_id, created_by)
VALUES ('Senior Java Developer',
        'Own backend services for the recruitment pipeline.',
        'Engineering', 'CC-ENG-100', 1, 'Backlog growth requires an additional senior backend engineer.',
        'Bengaluru', 'Full-Time', 5.0, 8.0,
        1800000, 2600000, 'Open', @recruiter_user_id, @hm_user_id, @system_user_id);

SET @sample_job_id = (SELECT job_id FROM job WHERE title = 'Senior Java Developer');

-- Sample screening questions for the sample job
INSERT INTO screening_question (job_id, question_text, question_type, mandatory_flag, disqualifying_answer, display_order, created_by)
VALUES
    (@sample_job_id, 'Are you willing to relocate to Bengaluru?', 'YesNo', TRUE, 'No', 1, @system_user_id),
    (@sample_job_id, 'Years of Java experience?', 'Numeric', TRUE, NULL, 2, @system_user_id);
