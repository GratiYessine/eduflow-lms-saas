package com.example.lms.users.dto;

import com.example.lms.users.entity.Role;
import com.example.lms.users.entity.UserStatus;

import java.time.Instant;

public record UserResponse(
        Long id,
        String firstName,
        String lastName,
        String email,
        String phone,
        String avatarUrl,
        Role role,
        UserStatus status,
        Long companyId,
        Instant createdAt,
        Instant updatedAt
) {
}
