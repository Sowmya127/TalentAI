package com.talentai.notification.repository;

import com.talentai.notification.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    @Query("SELECT n FROM Notification n WHERE n.isActive = true "
            + "AND (:recipientId IS NULL OR n.userId = :recipientId) ORDER BY n.notificationId DESC")
    List<Notification> history(@Param("recipientId") Long recipientId);
}
