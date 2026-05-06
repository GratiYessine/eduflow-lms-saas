package com.example.lms.quizzes.dto;

import jakarta.validation.constraints.NotNull;

import java.util.Set;

public record AnswerSubmissionRequest(
        @NotNull Long questionId,
        @NotNull Set<Long> selectedOptionIds
) {
}
