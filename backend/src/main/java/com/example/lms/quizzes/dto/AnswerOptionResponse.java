package com.example.lms.quizzes.dto;

public record AnswerOptionResponse(
        Long id,
        Long questionId,
        String text,
        Boolean correct
) {
}
