package com.example.lms.notifications.dto;

import com.example.lms.notifications.entity.NotificationType;

import java.time.Instant;

public record NotificationResponse(
        Long id,
        String title,
        String message,
        NotificationType type,
        boolean read,
        Instant createdAt
) {
}
