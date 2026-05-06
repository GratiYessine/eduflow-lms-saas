package com.example.lms.auth.dto;

import com.example.lms.users.dto.UserResponse;

public record AuthResponse(
        String accessToken,
        String refreshToken,
        String tokenType,
        UserResponse user
) {
}
