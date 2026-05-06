package com.example.lms.quizzes.dto;

import com.example.lms.quizzes.entity.QuestionType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record QuestionRequest(
        @NotBlank String questionText,
        @NotNull QuestionType type,
        int orderIndex,
        @Valid @NotEmpty List<AnswerOptionRequest> answers
) {
}
