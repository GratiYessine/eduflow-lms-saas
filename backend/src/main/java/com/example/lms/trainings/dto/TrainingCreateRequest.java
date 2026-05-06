package com.example.lms.trainings.dto;

import com.example.lms.trainings.entity.TrainingLevel;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record TrainingCreateRequest(
        @NotBlank @Size(max = 220) String title,
        @Size(max = 500) String shortDescription,
        String description,
        String thumbnailUrl,
        String introVideoUrl,
        @Size(max = 120) String category,
        @NotNull TrainingLevel level,
        @NotBlank @Size(max = 20) String language,
        @Min(0) int durationMinutes,
        @NotNull BigDecimal price
) {
}
