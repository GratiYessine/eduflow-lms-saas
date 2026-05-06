package com.example.lms.users.dto;

import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
        @Size(max = 80) String firstName,
        @Size(max = 80) String lastName,
        @Size(max = 40) String phone,
        String avatarUrl
) {
}
