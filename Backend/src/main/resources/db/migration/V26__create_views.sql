CREATE OR REPLACE VIEW vw_candidate_profile AS
SELECT
    c.candidate_id,
    u.user_id,
    u.first_name,
    u.last_name,
    u.email,
    u.phone_number,
    c.current_location,
    c.total_experience,
    c.resume_url,
    c.resume_score,
    c.notice_period_days,
    c.salary_expectation,
    c.is_active
FROM candidate c
INNER JOIN app_user u ON u.user_id = c.user_id;

CREATE OR REPLACE VIEW vw_job_applications AS
SELECT
    a.application_id,
    j.job_id,
    j.title AS job_title,
    j.department,
    j.job_status,
    c.candidate_id,
    CONCAT(u.first_name, ' ', u.last_name) AS candidate_name,
    u.email AS candidate_email,
    a.application_status,
    a.match_score,
    a.applied_date,
    a.source_channel
FROM application a
INNER JOIN job j       ON j.job_id = a.job_id
INNER JOIN candidate c ON c.candidate_id = a.candidate_id
INNER JOIN app_user u  ON u.user_id = c.user_id;

CREATE OR REPLACE VIEW vw_interview_schedule AS
SELECT
    i.interview_id,
    i.interview_date,
    i.interview_type,
    i.interview_mode,
    i.interview_status,
    a.application_id,
    j.title AS job_title,
    CONCAT(cu.first_name, ' ', cu.last_name) AS candidate_name,
    CONCAT(iu.first_name, ' ', iu.last_name) AS interviewer_name
FROM interview i
INNER JOIN application a ON a.application_id = i.application_id
INNER JOIN job j         ON j.job_id = a.job_id
INNER JOIN candidate c   ON c.candidate_id = a.candidate_id
INNER JOIN app_user cu   ON cu.user_id = c.user_id
INNER JOIN app_user iu   ON iu.user_id = i.interviewer_id;

CREATE OR REPLACE VIEW vw_recruitment_dashboard AS
SELECT
    (SELECT COUNT(*) FROM job WHERE job_status = 'Open')                              AS open_positions,
    (SELECT COUNT(*) FROM application)                                                AS total_applications,
    (SELECT COUNT(*) FROM application WHERE application_status = 'Shortlisted')       AS shortlisted,
    (SELECT COUNT(*) FROM interview)                                                  AS total_interviews,
    (SELECT COUNT(*) FROM offer)                                                      AS total_offers,
    (SELECT COUNT(*) FROM application WHERE application_status = 'Hired')             AS total_hires,
    (SELECT COUNT(*) FROM application WHERE application_status = 'Rejected')          AS total_rejections,
    (SELECT COUNT(*) FROM application WHERE application_status = 'Withdrawn')         AS total_withdrawn;
