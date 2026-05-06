package com.example.lms.progress.dto;

import com.example.lms.progress.entity.ProgressStatus;

import java.math.BigDecimal;
import java.time.Instant;

public record ProgressResponse(
        Long id,
        Long learnerId,
        Long trainingId,
        int completedLessons,
        BigDecimal progressPercentage,
        ProgressStatus status,
        Instant startedAt,
        Instant completedAt,
        Instant approvedAt,
        Long approvedBy
) {
}
