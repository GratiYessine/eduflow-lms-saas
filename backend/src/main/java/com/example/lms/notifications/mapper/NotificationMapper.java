package com.example.lms.notifications.mapper;

import com.example.lms.notifications.dto.NotificationResponse;
import com.example.lms.notifications.entity.Notification;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface NotificationMapper {
    NotificationResponse toResponse(Notification notification);
}
