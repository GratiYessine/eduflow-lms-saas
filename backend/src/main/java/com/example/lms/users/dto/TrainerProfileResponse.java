package com.example.lms.users.dto;

import java.math.BigDecimal;
import java.time.Instant;

public record TrainerProfileResponse(
        Long id,
        Long userId,
        String bio,
        String expertise,
        String portfolioUrl,
        String socialLinks,
        String verificationStatus,
        String motivation,
        String cvUrl,
        String certificateUrl,
        String diplomaUrl,
        String rejectionReason,
        Instant approvedAt,
        Long approvedBy,
        BigDecimal rating,
        int totalTrainings
) {
}
