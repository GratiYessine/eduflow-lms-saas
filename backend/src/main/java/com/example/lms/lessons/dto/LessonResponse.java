package com.example.lms.lessons.dto;

public record LessonResponse(
        Long id,
        Long trainingId,
        String title,
        String content,
        String videoUrl,
        int durationMinutes,
        int orderIndex,
        boolean preview
) {
}
