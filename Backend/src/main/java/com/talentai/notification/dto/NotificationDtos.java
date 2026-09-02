package com.talentai.notification.dto;

import jakarta.validation.constraints.NotNull;

public final class NotificationDtos {

    private NotificationDtos() {
    }

    public record TriggerRequest(
            @NotNull String channel,
            @NotNull Long recipientId,
            String template,
            @NotNull String event) {
    }

    public record TriggerResponse(Long notificationId, String status) {
    }

    public record NotificationHistoryItem(Long notificationId, String channel, String event,
                                          Long recipientId, String sentAt, String status) {
    }
}
