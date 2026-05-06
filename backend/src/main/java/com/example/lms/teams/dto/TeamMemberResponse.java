package com.example.lms.teams.dto;

import com.example.lms.users.entity.Role;
import com.example.lms.users.entity.UserStatus;

import java.time.Instant;

public record TeamMemberResponse(
        Long id,
        Long userId,
        Long teamId,
        Long companyId,
        String position,
        Instant joinedAt,
        String firstName,
        String lastName,
        String email,
        Role role,
        UserStatus status
) {
}
