package com.example.lms.trainings.dto;

import com.example.lms.trainings.entity.TrainingLevel;
import com.example.lms.trainings.entity.TrainingStatus;

import java.math.BigDecimal;
import java.time.Instant;

public record TrainingResponse(
        Long id,
        Long trainerId,
        String title,
        String slug,
        String shortDescription,
        String description,
        String thumbnailUrl,
        String introVideoUrl,
        String category,
        TrainingLevel level,
        String language,
        int durationMinutes,
        BigDecimal price,
        TrainingStatus status,
        Instant createdAt,
        Instant updatedAt
) {
}
