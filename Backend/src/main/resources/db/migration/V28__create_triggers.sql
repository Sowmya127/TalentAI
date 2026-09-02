-- =====================================================================
-- Triggers.
--
-- ModifiedDate auto-update, which needed 17 separate triggers in the
-- SQL Server version, is not needed here at all -- every table already
-- declares `modified_date DATETIME NULL ON UPDATE CURRENT_TIMESTAMP`,
-- which MySQL maintains natively on any UPDATE.
--
-- What remains is audit logging on the same 8 business-critical tables
-- as the SQL Server version (application, offer, interview,
-- interview_feedback, candidate, job, candidate_demographic,
-- approval_history). MySQL cannot combine INSERT/UPDATE/DELETE into
-- one trigger the way SQL Server does, so each table gets three -- one
-- per event -- and there's no FOR JSON AUTO equivalent, so each one
-- explicitly lists its table's columns via JSON_OBJECT().
-- =====================================================================

DELIMITER //

-- ---------------------------------------------------------------------
-- application
-- ---------------------------------------------------------------------
CREATE TRIGGER trg_application_ai AFTER INSERT ON application FOR EACH ROW
BEGIN
    INSERT INTO audit_log (user_id, action_type, entity_type, entity_id, old_value, new_value, action_date)
    VALUES (COALESCE(NEW.modified_by, NEW.created_by), 'INSERT', 'Application', NEW.application_id, NULL,
        JSON_OBJECT('application_id', NEW.application_id, 'candidate_id', NEW.candidate_id, 'job_id', NEW.job_id,
            'applied_date', NEW.applied_date, 'application_status', NEW.application_status, 'match_score', NEW.match_score,
            'source_channel', NEW.source_channel, 'consent_given', NEW.consent_given, 'consent_date', NEW.consent_date,
            'consent_version', NEW.consent_version, 'is_active', NEW.is_active),
        NOW());
END//

CREATE TRIGGER trg_application_au AFTER UPDATE ON application FOR EACH ROW
BEGIN
    INSERT INTO audit_log (user_id, action_type, entity_type, entity_id, old_value, new_value, action_date)
    VALUES (COALESCE(NEW.modified_by, NEW.created_by), 'UPDATE', 'Application', NEW.application_id,
        JSON_OBJECT('application_id', OLD.application_id, 'candidate_id', OLD.candidate_id, 'job_id', OLD.job_id,
            'applied_date', OLD.applied_date, 'application_status', OLD.application_status, 'match_score', OLD.match_score,
            'source_channel', OLD.source_channel, 'consent_given', OLD.consent_given, 'consent_date', OLD.consent_date,
            'consent_version', OLD.consent_version, 'is_active', OLD.is_active),
        JSON_OBJECT('application_id', NEW.application_id, 'candidate_id', NEW.candidate_id, 'job_id', NEW.job_id,
            'applied_date', NEW.applied_date, 'application_status', NEW.application_status, 'match_score', NEW.match_score,
            'source_channel', NEW.source_channel, 'consent_given', NEW.consent_given, 'consent_date', NEW.consent_date,
            'consent_version', NEW.consent_version, 'is_active', NEW.is_active),
        NOW());
END//

CREATE TRIGGER trg_application_ad AFTER DELETE ON application FOR EACH ROW
BEGIN
    INSERT INTO audit_log (user_id, action_type, entity_type, entity_id, old_value, new_value, action_date)
    VALUES (COALESCE(OLD.modified_by, OLD.created_by), 'DELETE', 'Application', OLD.application_id,
        JSON_OBJECT('application_id', OLD.application_id, 'candidate_id', OLD.candidate_id, 'job_id', OLD.job_id,
            'applied_date', OLD.applied_date, 'application_status', OLD.application_status, 'match_score', OLD.match_score,
            'source_channel', OLD.source_channel, 'consent_given', OLD.consent_given, 'consent_date', OLD.consent_date,
            'consent_version', OLD.consent_version, 'is_active', OLD.is_active),
        NULL, NOW());
END//

-- ---------------------------------------------------------------------
-- offer
-- ---------------------------------------------------------------------
CREATE TRIGGER trg_offer_ai AFTER INSERT ON offer FOR EACH ROW
BEGIN
    INSERT INTO audit_log (user_id, action_type, entity_type, entity_id, old_value, new_value, action_date)
    VALUES (COALESCE(NEW.modified_by, NEW.created_by), 'INSERT', 'Offer', NEW.offer_id, NULL,
        JSON_OBJECT('offer_id', NEW.offer_id, 'application_id', NEW.application_id, 'salary', NEW.salary,
            'joining_date', NEW.joining_date, 'offer_status', NEW.offer_status, 'approved_by', NEW.approved_by,
            'decline_reason', NEW.decline_reason, 'signed_document_url', NEW.signed_document_url, 'is_active', NEW.is_active),
        NOW());
END//

CREATE TRIGGER trg_offer_au AFTER UPDATE ON offer FOR EACH ROW
BEGIN
    INSERT INTO audit_log (user_id, action_type, entity_type, entity_id, old_value, new_value, action_date)
    VALUES (COALESCE(NEW.modified_by, NEW.created_by), 'UPDATE', 'Offer', NEW.offer_id,
        JSON_OBJECT('offer_id', OLD.offer_id, 'application_id', OLD.application_id, 'salary', OLD.salary,
            'joining_date', OLD.joining_date, 'offer_status', OLD.offer_status, 'approved_by', OLD.approved_by,
            'decline_reason', OLD.decline_reason, 'signed_document_url', OLD.signed_document_url, 'is_active', OLD.is_active),
        JSON_OBJECT('offer_id', NEW.offer_id, 'application_id', NEW.application_id, 'salary', NEW.salary,
            'joining_date', NEW.joining_date, 'offer_status', NEW.offer_status, 'approved_by', NEW.approved_by,
            'decline_reason', NEW.decline_reason, 'signed_document_url', NEW.signed_document_url, 'is_active', NEW.is_active),
        NOW());
END//

CREATE TRIGGER trg_offer_ad AFTER DELETE ON offer FOR EACH ROW
BEGIN
    INSERT INTO audit_log (user_id, action_type, entity_type, entity_id, old_value, new_value, action_date)
    VALUES (COALESCE(OLD.modified_by, OLD.created_by), 'DELETE', 'Offer', OLD.offer_id,
        JSON_OBJECT('offer_id', OLD.offer_id, 'application_id', OLD.application_id, 'salary', OLD.salary,
            'joining_date', OLD.joining_date, 'offer_status', OLD.offer_status, 'approved_by', OLD.approved_by,
            'decline_reason', OLD.decline_reason, 'signed_document_url', OLD.signed_document_url, 'is_active', OLD.is_active),
        NULL, NOW());
END//

-- ---------------------------------------------------------------------
-- interview
-- ---------------------------------------------------------------------
CREATE TRIGGER trg_interview_ai AFTER INSERT ON interview FOR EACH ROW
BEGIN
    INSERT INTO audit_log (user_id, action_type, entity_type, entity_id, old_value, new_value, action_date)
    VALUES (COALESCE(NEW.modified_by, NEW.created_by), 'INSERT', 'Interview', NEW.interview_id, NULL,
        JSON_OBJECT('interview_id', NEW.interview_id, 'application_id', NEW.application_id, 'interviewer_id', NEW.interviewer_id,
            'interview_date', NEW.interview_date, 'interview_type', NEW.interview_type, 'interview_mode', NEW.interview_mode,
            'interview_status', NEW.interview_status, 'is_active', NEW.is_active),
        NOW());
END//

CREATE TRIGGER trg_interview_au AFTER UPDATE ON interview FOR EACH ROW
BEGIN
    INSERT INTO audit_log (user_id, action_type, entity_type, entity_id, old_value, new_value, action_date)
    VALUES (COALESCE(NEW.modified_by, NEW.created_by), 'UPDATE', 'Interview', NEW.interview_id,
        JSON_OBJECT('interview_id', OLD.interview_id, 'application_id', OLD.application_id, 'interviewer_id', OLD.interviewer_id,
            'interview_date', OLD.interview_date, 'interview_type', OLD.interview_type, 'interview_mode', OLD.interview_mode,
            'interview_status', OLD.interview_status, 'is_active', OLD.is_active),
        JSON_OBJECT('interview_id', NEW.interview_id, 'application_id', NEW.application_id, 'interviewer_id', NEW.interviewer_id,
            'interview_date', NEW.interview_date, 'interview_type', NEW.interview_type, 'interview_mode', NEW.interview_mode,
            'interview_status', NEW.interview_status, 'is_active', NEW.is_active),
        NOW());
END//

CREATE TRIGGER trg_interview_ad AFTER DELETE ON interview FOR EACH ROW
BEGIN
    INSERT INTO audit_log (user_id, action_type, entity_type, entity_id, old_value, new_value, action_date)
    VALUES (COALESCE(OLD.modified_by, OLD.created_by), 'DELETE', 'Interview', OLD.interview_id,
        JSON_OBJECT('interview_id', OLD.interview_id, 'application_id', OLD.application_id, 'interviewer_id', OLD.interviewer_id,
            'interview_date', OLD.interview_date, 'interview_type', OLD.interview_type, 'interview_mode', OLD.interview_mode,
            'interview_status', OLD.interview_status, 'is_active', OLD.is_active),
        NULL, NOW());
END//

-- ---------------------------------------------------------------------
-- interview_feedback
-- ---------------------------------------------------------------------
CREATE TRIGGER trg_interview_feedback_ai AFTER INSERT ON interview_feedback FOR EACH ROW
BEGIN
    INSERT INTO audit_log (user_id, action_type, entity_type, entity_id, old_value, new_value, action_date)
    VALUES (COALESCE(NEW.modified_by, NEW.created_by), 'INSERT', 'InterviewFeedback', NEW.feedback_id, NULL,
        JSON_OBJECT('feedback_id', NEW.feedback_id, 'interview_id', NEW.interview_id, 'interviewer_id', NEW.interviewer_id,
            'recommendation', NEW.recommendation, 'comments', NEW.comments, 'is_active', NEW.is_active),
        NOW());
END//

CREATE TRIGGER trg_interview_feedback_au AFTER UPDATE ON interview_feedback FOR EACH ROW
BEGIN
    INSERT INTO audit_log (user_id, action_type, entity_type, entity_id, old_value, new_value, action_date)
    VALUES (COALESCE(NEW.modified_by, NEW.created_by), 'UPDATE', 'InterviewFeedback', NEW.feedback_id,
        JSON_OBJECT('feedback_id', OLD.feedback_id, 'interview_id', OLD.interview_id, 'interviewer_id', OLD.interviewer_id,
            'recommendation', OLD.recommendation, 'comments', OLD.comments, 'is_active', OLD.is_active),
        JSON_OBJECT('feedback_id', NEW.feedback_id, 'interview_id', NEW.interview_id, 'interviewer_id', NEW.interviewer_id,
            'recommendation', NEW.recommendation, 'comments', NEW.comments, 'is_active', NEW.is_active),
        NOW());
END//

CREATE TRIGGER trg_interview_feedback_ad AFTER DELETE ON interview_feedback FOR EACH ROW
BEGIN
    INSERT INTO audit_log (user_id, action_type, entity_type, entity_id, old_value, new_value, action_date)
    VALUES (COALESCE(OLD.modified_by, OLD.created_by), 'DELETE', 'InterviewFeedback', OLD.feedback_id,
        JSON_OBJECT('feedback_id', OLD.feedback_id, 'interview_id', OLD.interview_id, 'interviewer_id', OLD.interviewer_id,
            'recommendation', OLD.recommendation, 'comments', OLD.comments, 'is_active', OLD.is_active),
        NULL, NOW());
END//

-- ---------------------------------------------------------------------
-- candidate
-- ---------------------------------------------------------------------
CREATE TRIGGER trg_candidate_ai AFTER INSERT ON candidate FOR EACH ROW
BEGIN
    INSERT INTO audit_log (user_id, action_type, entity_type, entity_id, old_value, new_value, action_date)
    VALUES (COALESCE(NEW.modified_by, NEW.created_by), 'INSERT', 'Candidate', NEW.candidate_id, NULL,
        JSON_OBJECT('candidate_id', NEW.candidate_id, 'user_id', NEW.user_id, 'date_of_birth', NEW.date_of_birth,
            'gender', NEW.gender, 'current_location', NEW.current_location, 'total_experience', NEW.total_experience,
            'resume_url', NEW.resume_url, 'resume_score', NEW.resume_score, 'notice_period_days', NEW.notice_period_days,
            'salary_expectation', NEW.salary_expectation, 'is_active', NEW.is_active),
        NOW());
END//

CREATE TRIGGER trg_candidate_au AFTER UPDATE ON candidate FOR EACH ROW
BEGIN
    INSERT INTO audit_log (user_id, action_type, entity_type, entity_id, old_value, new_value, action_date)
    VALUES (COALESCE(NEW.modified_by, NEW.created_by), 'UPDATE', 'Candidate', NEW.candidate_id,
        JSON_OBJECT('candidate_id', OLD.candidate_id, 'user_id', OLD.user_id, 'date_of_birth', OLD.date_of_birth,
            'gender', OLD.gender, 'current_location', OLD.current_location, 'total_experience', OLD.total_experience,
            'resume_url', OLD.resume_url, 'resume_score', OLD.resume_score, 'notice_period_days', OLD.notice_period_days,
            'salary_expectation', OLD.salary_expectation, 'is_active', OLD.is_active),
        JSON_OBJECT('candidate_id', NEW.candidate_id, 'user_id', NEW.user_id, 'date_of_birth', NEW.date_of_birth,
            'gender', NEW.gender, 'current_location', NEW.current_location, 'total_experience', NEW.total_experience,
            'resume_url', NEW.resume_url, 'resume_score', NEW.resume_score, 'notice_period_days', NEW.notice_period_days,
            'salary_expectation', NEW.salary_expectation, 'is_active', NEW.is_active),
        NOW());
END//

CREATE TRIGGER trg_candidate_ad AFTER DELETE ON candidate FOR EACH ROW
BEGIN
    INSERT INTO audit_log (user_id, action_type, entity_type, entity_id, old_value, new_value, action_date)
    VALUES (COALESCE(OLD.modified_by, OLD.created_by), 'DELETE', 'Candidate', OLD.candidate_id,
        JSON_OBJECT('candidate_id', OLD.candidate_id, 'user_id', OLD.user_id, 'date_of_birth', OLD.date_of_birth,
            'gender', OLD.gender, 'current_location', OLD.current_location, 'total_experience', OLD.total_experience,
            'resume_url', OLD.resume_url, 'resume_score', OLD.resume_score, 'notice_period_days', OLD.notice_period_days,
            'salary_expectation', OLD.salary_expectation, 'is_active', OLD.is_active),
        NULL, NOW());
END//

-- ---------------------------------------------------------------------
-- job
-- ---------------------------------------------------------------------
CREATE TRIGGER trg_job_ai AFTER INSERT ON job FOR EACH ROW
BEGIN
    INSERT INTO audit_log (user_id, action_type, entity_type, entity_id, old_value, new_value, action_date)
    VALUES (COALESCE(NEW.modified_by, NEW.created_by), 'INSERT', 'Job', NEW.job_id, NULL,
        JSON_OBJECT('job_id', NEW.job_id, 'title', NEW.title, 'department', NEW.department, 'cost_center', NEW.cost_center,
            'headcount', NEW.headcount, 'location', NEW.location, 'employment_type', NEW.employment_type,
            'salary_min', NEW.salary_min, 'salary_max', NEW.salary_max, 'job_status', NEW.job_status,
            'recruiter_id', NEW.recruiter_id, 'hiring_manager_id', NEW.hiring_manager_id, 'is_active', NEW.is_active),
        NOW());
END//

CREATE TRIGGER trg_job_au AFTER UPDATE ON job FOR EACH ROW
BEGIN
    INSERT INTO audit_log (user_id, action_type, entity_type, entity_id, old_value, new_value, action_date)
    VALUES (COALESCE(NEW.modified_by, NEW.created_by), 'UPDATE', 'Job', NEW.job_id,
        JSON_OBJECT('job_id', OLD.job_id, 'title', OLD.title, 'department', OLD.department, 'cost_center', OLD.cost_center,
            'headcount', OLD.headcount, 'location', OLD.location, 'employment_type', OLD.employment_type,
            'salary_min', OLD.salary_min, 'salary_max', OLD.salary_max, 'job_status', OLD.job_status,
            'recruiter_id', OLD.recruiter_id, 'hiring_manager_id', OLD.hiring_manager_id, 'is_active', OLD.is_active),
        JSON_OBJECT('job_id', NEW.job_id, 'title', NEW.title, 'department', NEW.department, 'cost_center', NEW.cost_center,
            'headcount', NEW.headcount, 'location', NEW.location, 'employment_type', NEW.employment_type,
            'salary_min', NEW.salary_min, 'salary_max', NEW.salary_max, 'job_status', NEW.job_status,
            'recruiter_id', NEW.recruiter_id, 'hiring_manager_id', NEW.hiring_manager_id, 'is_active', NEW.is_active),
        NOW());
END//

CREATE TRIGGER trg_job_ad AFTER DELETE ON job FOR EACH ROW
BEGIN
    INSERT INTO audit_log (user_id, action_type, entity_type, entity_id, old_value, new_value, action_date)
    VALUES (COALESCE(OLD.modified_by, OLD.created_by), 'DELETE', 'Job', OLD.job_id,
        JSON_OBJECT('job_id', OLD.job_id, 'title', OLD.title, 'department', OLD.department, 'cost_center', OLD.cost_center,
            'headcount', OLD.headcount, 'location', OLD.location, 'employment_type', OLD.employment_type,
            'salary_min', OLD.salary_min, 'salary_max', OLD.salary_max, 'job_status', OLD.job_status,
            'recruiter_id', OLD.recruiter_id, 'hiring_manager_id', OLD.hiring_manager_id, 'is_active', OLD.is_active),
        NULL, NOW());
END//

-- ---------------------------------------------------------------------
-- candidate_demographic
-- ---------------------------------------------------------------------
CREATE TRIGGER trg_candidate_demographic_ai AFTER INSERT ON candidate_demographic FOR EACH ROW
BEGIN
    INSERT INTO audit_log (user_id, action_type, entity_type, entity_id, old_value, new_value, action_date)
    VALUES (COALESCE(NEW.modified_by, NEW.created_by), 'INSERT', 'CandidateDemographic', NEW.demographic_id, NULL,
        JSON_OBJECT('demographic_id', NEW.demographic_id, 'candidate_id', NEW.candidate_id,
            'gender_self_id', NEW.gender_self_id, 'ethnicity_self_id', NEW.ethnicity_self_id,
            'disability_status', NEW.disability_status, 'veteran_status', NEW.veteran_status,
            'consent_given', NEW.consent_given, 'consent_date', NEW.consent_date, 'is_active', NEW.is_active),
        NOW());
END//

CREATE TRIGGER trg_candidate_demographic_au AFTER UPDATE ON candidate_demographic FOR EACH ROW
BEGIN
    INSERT INTO audit_log (user_id, action_type, entity_type, entity_id, old_value, new_value, action_date)
    VALUES (COALESCE(NEW.modified_by, NEW.created_by), 'UPDATE', 'CandidateDemographic', NEW.demographic_id,
        JSON_OBJECT('demographic_id', OLD.demographic_id, 'candidate_id', OLD.candidate_id,
            'gender_self_id', OLD.gender_self_id, 'ethnicity_self_id', OLD.ethnicity_self_id,
            'disability_status', OLD.disability_status, 'veteran_status', OLD.veteran_status,
            'consent_given', OLD.consent_given, 'consent_date', OLD.consent_date, 'is_active', OLD.is_active),
        JSON_OBJECT('demographic_id', NEW.demographic_id, 'candidate_id', NEW.candidate_id,
            'gender_self_id', NEW.gender_self_id, 'ethnicity_self_id', NEW.ethnicity_self_id,
            'disability_status', NEW.disability_status, 'veteran_status', NEW.veteran_status,
            'consent_given', NEW.consent_given, 'consent_date', NEW.consent_date, 'is_active', NEW.is_active),
        NOW());
END//

CREATE TRIGGER trg_candidate_demographic_ad AFTER DELETE ON candidate_demographic FOR EACH ROW
BEGIN
    INSERT INTO audit_log (user_id, action_type, entity_type, entity_id, old_value, new_value, action_date)
    VALUES (COALESCE(OLD.modified_by, OLD.created_by), 'DELETE', 'CandidateDemographic', OLD.demographic_id,
        JSON_OBJECT('demographic_id', OLD.demographic_id, 'candidate_id', OLD.candidate_id,
            'gender_self_id', OLD.gender_self_id, 'ethnicity_self_id', OLD.ethnicity_self_id,
            'disability_status', OLD.disability_status, 'veteran_status', OLD.veteran_status,
            'consent_given', OLD.consent_given, 'consent_date', OLD.consent_date, 'is_active', OLD.is_active),
        NULL, NOW());
END//

-- ---------------------------------------------------------------------
-- approval_history
-- ---------------------------------------------------------------------
CREATE TRIGGER trg_approval_history_ai AFTER INSERT ON approval_history FOR EACH ROW
BEGIN
    INSERT INTO audit_log (user_id, action_type, entity_type, entity_id, old_value, new_value, action_date)
    VALUES (COALESCE(NEW.modified_by, NEW.created_by), 'INSERT', 'ApprovalHistory', NEW.approval_id, NULL,
        JSON_OBJECT('approval_id', NEW.approval_id, 'entity_type', NEW.entity_type, 'entity_id', NEW.entity_id,
            'approval_stage', NEW.approval_stage, 'approver_id', NEW.approver_id, 'decision', NEW.decision,
            'comments', NEW.comments, 'action_date', NEW.action_date, 'is_active', NEW.is_active),
        NOW());
END//

CREATE TRIGGER trg_approval_history_au AFTER UPDATE ON approval_history FOR EACH ROW
BEGIN
    INSERT INTO audit_log (user_id, action_type, entity_type, entity_id, old_value, new_value, action_date)
    VALUES (COALESCE(NEW.modified_by, NEW.created_by), 'UPDATE', 'ApprovalHistory', NEW.approval_id,
        JSON_OBJECT('approval_id', OLD.approval_id, 'entity_type', OLD.entity_type, 'entity_id', OLD.entity_id,
            'approval_stage', OLD.approval_stage, 'approver_id', OLD.approver_id, 'decision', OLD.decision,
            'comments', OLD.comments, 'action_date', OLD.action_date, 'is_active', OLD.is_active),
        JSON_OBJECT('approval_id', NEW.approval_id, 'entity_type', NEW.entity_type, 'entity_id', NEW.entity_id,
            'approval_stage', NEW.approval_stage, 'approver_id', NEW.approver_id, 'decision', NEW.decision,
            'comments', NEW.comments, 'action_date', NEW.action_date, 'is_active', NEW.is_active),
        NOW());
END//

CREATE TRIGGER trg_approval_history_ad AFTER DELETE ON approval_history FOR EACH ROW
BEGIN
    INSERT INTO audit_log (user_id, action_type, entity_type, entity_id, old_value, new_value, action_date)
    VALUES (COALESCE(OLD.modified_by, OLD.created_by), 'DELETE', 'ApprovalHistory', OLD.approval_id,
        JSON_OBJECT('approval_id', OLD.approval_id, 'entity_type', OLD.entity_type, 'entity_id', OLD.entity_id,
            'approval_stage', OLD.approval_stage, 'approver_id', OLD.approver_id, 'decision', OLD.decision,
            'comments', OLD.comments, 'action_date', OLD.action_date, 'is_active', OLD.is_active),
        NULL, NOW());
END//

DELIMITER ;
