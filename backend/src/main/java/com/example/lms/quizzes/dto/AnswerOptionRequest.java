package com.example.lms.quizzes.dto;

import jakarta.validation.constraints.NotBlank;

public record AnswerOptionRequest(
        @NotBlank String text,
        boolean correct
) {
}
