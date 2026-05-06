package com.example.lms.notifications.service;

import com.example.lms.common.dto.PageResponse;
import com.example.lms.common.exception.ForbiddenException;
import com.example.lms.common.exception.ResourceNotFoundException;
import com.example.lms.notifications.dto.NotificationResponse;
import com.example.lms.notifications.entity.Notification;
import com.example.lms.notifications.entity.NotificationType;
import com.example.lms.notifications.mapper.NotificationMapper;
import com.example.lms.notifications.repository.NotificationRepository;
import com.example.lms.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final NotificationMapper notificationMapper;

    @Transactional
    public void notify(Long userId, String title, String message, NotificationType type) {
        if (userId == null) {
            return;
        }
        Notification notification = new Notification();
        notification.setUserId(userId);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setType(type);
        notificationRepository.save(notification);
    }

    @Transactional(readOnly = true)
    public PageResponse<NotificationResponse> myNotifications(Pageable pageable) {
        Long userId = SecurityUtils.currentUserId();
        return PageResponse.from(notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable)
                .map(notificationMapper::toResponse));
    }

    @Transactional
    public NotificationResponse markRead(Long id) {
        Long userId = SecurityUtils.currentUserId();
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));
        if (!userId.equals(notification.getUserId())) {
            throw new ForbiddenException("Notification belongs to another user");
        }
        notification.setRead(true);
        return notificationMapper.toResponse(notification);
    }

    @Transactional
    public void markAllRead() {
        notificationRepository.markAllRead(SecurityUtils.currentUserId());
    }
}
