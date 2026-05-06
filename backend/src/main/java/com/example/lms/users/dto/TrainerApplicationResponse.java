package com.example.lms.users.dto;

import java.time.Instant;

public record TrainerApplicationResponse(
        Long trainerId,
        Long profileId,
        String firstName,
        String lastName,
        String email,
        String phone,
        String userStatus,
        String verificationStatus,
        String expertise,
        String bio,
        String portfolioUrl,
        String socialLinks,
        String motivation,
        String cvUrl,
        String certificateUrl,
        String diplomaUrl,
        String rejectionReason,
        Instant approvedAt,
        Long approvedBy,
        Instant submittedAt
) {
}
