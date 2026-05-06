package com.example.lms.lessons.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LessonCreateRequest(
        @NotBlank @Size(max = 220) String title,
        String content,
        String videoUrl,
        @Min(0) int durationMinutes,
        @Min(0) int orderIndex,
        boolean preview
) {
}
