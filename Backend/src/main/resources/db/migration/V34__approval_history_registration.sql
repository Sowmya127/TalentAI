-- Reuse the polymorphic approval_history table for registration decisions:
-- entity_type='Registration', entity_id = user_registration_request.request_id.
ALTER TABLE approval_history DROP CHECK ck_approval_history_entity_type;
ALTER TABLE approval_history ADD CONSTRAINT ck_approval_history_entity_type
    CHECK (entity_type IN ('Job', 'Offer', 'Registration'));
