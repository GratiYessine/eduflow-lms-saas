package com.example.lms.quizzes.dto;

import com.example.lms.quizzes.entity.QuestionType;

import java.util.List;

public record QuestionResponse(
        Long id,
        Long quizId,
        String questionText,
        QuestionType type,
        int orderIndex,
        List<AnswerOptionResponse> answers
) {
}
