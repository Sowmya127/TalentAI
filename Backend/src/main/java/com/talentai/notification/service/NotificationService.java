package com.talentai.notification.service;

import com.talentai.notification.entity.Notification;
import com.talentai.notification.repository.NotificationRepository;
import com.talentai.user.entity.UserRole;
import com.talentai.user.repository.UserRoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Thin helper over the existing notification table. Registration events use
 * in-app notifications (no external mail provider is configured); the delivery
 * channel can be switched per-row via notification_type.
 */
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRoleRepository userRoleRepository;

    @Transactional
    public void notifyUser(Long recipientUserId, String subject, String message, Long actorUserId) {
        if (recipientUserId == null) {
            return;
        }
        notificationRepository.save(Notification.builder()
                .userId(recipientUserId)
                .notificationType("InApp")
                .subject(truncate(subject, 150))
                .message(message)
                .notificationStatus("Sent")
                .sentDate(LocalDateTime.now())
                .createdBy(actorUserId)
                .isActive(true)
                .build());
    }

    /** Sends the same in-app notification to every active holder of any of the given roles. */
    @Transactional
    public void notifyRoles(List<String> roleNames, String subject, String message, Long actorUserId) {
        for (UserRole ur : userRoleRepository.findByRole_RoleNameInAndIsActiveTrue(roleNames)) {
            notifyUser(ur.getUser().getUserId(), subject, message, actorUserId);
        }
    }

    private String truncate(String s, int max) {
        if (s == null) {
            return null;
        }
        return s.length() <= max ? s : s.substring(0, max);
    }
}
