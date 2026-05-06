package com.example.lms.quizzes.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record QuizCreateRequest(
        @NotBlank String title,
        @Min(0) @Max(100) int passingScore,
        @Min(1) int maxAttempts,
        @Valid @NotEmpty List<QuestionRequest> questions
) {
}
