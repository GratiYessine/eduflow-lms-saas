package com.example.lms.quizzes.dto;

import java.util.List;

public record QuizResponse(
        Long id,
        Long lessonId,
        String title,
        int passingScore,
        int maxAttempts,
        boolean published,
        List<QuestionResponse> questions
) {
}
