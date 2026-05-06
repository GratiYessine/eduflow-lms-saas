package com.example.lms.lessons.dto;

import java.time.Instant;

public record LessonResourceResponse(
        Long id,
        Long lessonId,
        Long fileId,
        String fileUrl,
        String fileType,
        String originalName,
        long size,
        Instant createdAt
) {
}
