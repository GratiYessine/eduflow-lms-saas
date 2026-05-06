package com.example.lms.notifications.controller;

import com.example.lms.common.dto.ApiResponse;
import com.example.lms.common.dto.PageResponse;
import com.example.lms.notifications.dto.NotificationResponse;
import com.example.lms.notifications.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ApiResponse<PageResponse<NotificationResponse>> list(Pageable pageable) {
        return ApiResponse.success("Notifications loaded successfully", notificationService.myNotifications(pageable));
    }

    @PatchMapping("/{id}/read")
    public ApiResponse<NotificationResponse> markRead(@PathVariable Long id) {
        return ApiResponse.success("Notification marked as read", notificationService.markRead(id));
    }

    @PatchMapping("/read-all")
    public ApiResponse<Void> markAllRead() {
        notificationService.markAllRead();
        return ApiResponse.success("Notifications marked as read");
    }
}
