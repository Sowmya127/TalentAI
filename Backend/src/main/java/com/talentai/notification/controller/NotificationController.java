package com.talentai.notification.controller;

import com.talentai.common.response.ListResponse;
import com.talentai.notification.dto.NotificationDtos.*;
import com.talentai.notification.entity.Notification;
import com.talentai.notification.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

/**
 * In production these are triggered internally by the workflow engine on
 * recruitment events (BR-050). Here the endpoint records a notification
 * and marks it Sent; no external Email/SMS gateway is wired up, so no
 * message actually leaves the system.
 */
@RestController
@RequestMapping("/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationRepository notificationRepository;

    @PostMapping
    @Transactional
    public ResponseEntity<TriggerResponse> trigger(@RequestBody TriggerRequest req) {
        Notification n = notificationRepository.save(Notification.builder()
                .userId(req.recipientId())
                .notificationType(req.channel())
                .subject(req.event())
                .message(req.template())
                .notificationStatus("Sent")
                .sentDate(LocalDateTime.now())
                .isActive(true)
                .build());
        return ResponseEntity.status(HttpStatus.CREATED).body(new TriggerResponse(n.getNotificationId(), "Sent"));
    }

    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<ListResponse<NotificationHistoryItem>> history(@RequestParam(required = false) Long recipientId) {
        List<NotificationHistoryItem> data = notificationRepository.history(recipientId).stream()
                .map(n -> new NotificationHistoryItem(n.getNotificationId(), n.getNotificationType(), n.getSubject(),
                        n.getUserId(), n.getSentDate() == null ? null : n.getSentDate().toString(),
                        n.getNotificationStatus()))
                .toList();
        return ResponseEntity.ok(ListResponse.of(data));
    }
}
