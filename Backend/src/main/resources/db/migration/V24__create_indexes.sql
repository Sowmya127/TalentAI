-- Explicitly requested (email and skill_name are already covered by
-- the uq_user_email / uq_skill_skill_name unique constraints).
CREATE INDEX ix_job_job_status           ON job (job_status);
CREATE INDEX ix_application_status       ON application (application_status);
CREATE INDEX ix_interview_interview_date ON interview (interview_date);
CREATE INDEX ix_offer_offer_status       ON offer (offer_status);

-- Foreign-key lookup / join performance (MySQL does index FK columns
-- automatically when the FK is created, but these composite/explicit
-- indexes cover query patterns the auto-generated ones don't).
CREATE INDEX ix_screening_question_job_id            ON screening_question (job_id);
CREATE INDEX ix_screening_response_application_id     ON screening_response (application_id);
CREATE INDEX ix_screening_response_question_id         ON screening_response (question_id);
CREATE INDEX ix_approval_history_entity_type_entity_id  ON approval_history (entity_type, entity_id);
CREATE INDEX ix_candidate_demographic_candidate_id        ON candidate_demographic (candidate_id);
CREATE INDEX ix_audit_log_entity_type_entity_id              ON audit_log (entity_type, entity_id);
CREATE INDEX ix_audit_log_action_date                          ON audit_log (action_date);
