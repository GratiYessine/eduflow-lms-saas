package com.example.lms.progress.dto;

import java.time.Instant;

public record QuizAttemptResponse(
        Long id,
        Long learnerId,
        Long quizId,
        int score,
        boolean passed,
        int attemptNumber,
        Instant submittedAt
) {
}
