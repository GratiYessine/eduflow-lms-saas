package com.example.lms.trainings.dto;

import com.example.lms.trainings.entity.TrainingLevel;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record TrainingUpdateRequest(
        @Size(max = 220) String title,
        @Size(max = 500) String shortDescription,
        String description,
        String thumbnailUrl,
        String introVideoUrl,
        @Size(max = 120) String category,
        TrainingLevel level,
        @Size(max = 20) String language,
        @Min(0) Integer durationMinutes,
        BigDecimal price
) {
}
