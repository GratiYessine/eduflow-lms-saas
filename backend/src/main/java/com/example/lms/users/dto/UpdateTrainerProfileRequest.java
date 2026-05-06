package com.example.lms.users.dto;

import jakarta.validation.constraints.Size;

public record UpdateTrainerProfileRequest(
        @Size(max = 5000) String bio,
        @Size(max = 3000) String expertise,
        String portfolioUrl,
        String socialLinks,
        @Size(max = 5000) String motivation,
        String cvUrl,
        String certificateUrl,
        String diplomaUrl
) {
}
