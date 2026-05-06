package com.example.lms.lessons.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

public record LessonUpdateRequest(
        @Size(max = 220) String title,
        String content,
        String videoUrl,
        @Min(0) Integer durationMinutes,
        @Min(0) Integer orderIndex,
        Boolean preview
) {
}
