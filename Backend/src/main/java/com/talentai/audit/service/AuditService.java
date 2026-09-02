package com.talentai.audit.service;

import com.talentai.audit.entity.AuditLog;
import com.talentai.audit.repository.AuditLogRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/** Shared helper any service can call to write an audit_log row --
 *  used for tables (app_user, chiefly) that don't have a DB-level
 *  audit trigger. BR-006: significant user and recruitment activities
 *  shall be recorded in the audit trail. */
@Service
@RequiredArgsConstructor
public class AuditService {

    private static final Logger log = LoggerFactory.getLogger(AuditService.class);

    private final AuditLogRepository auditLogRepository;
    private final ObjectMapper objectMapper;

    public void log(Long actorUserId, String actionType, String entityType, Long entityId, Object oldValue, Object newValue) {
        AuditLog entry = AuditLog.builder()
                .userId(actorUserId)
                .actionType(actionType)
                .entityType(entityType)
                .entityId(entityId)
                .oldValue(toJson(oldValue))
                .newValue(toJson(newValue))
                .build();
        auditLogRepository.save(entry);
    }

    private String toJson(Object value) {
        if (value == null) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException e) {
            log.warn("Failed to serialize audit value for entity; storing null instead", e);
            return null;
        }
    }
}
