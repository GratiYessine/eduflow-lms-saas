package com.example.lms.users.dto;

import java.math.BigDecimal;

public record TrainerApprovalResponse(
        Long progressId,
        Long learnerId,
        String firstName,
        String lastName,
        String email,
        Long trainingId,
        String trainingTitle,
        BigDecimal progressPercentage,
        Integer quizScore,
        String status,
        boolean certificateGenerated
) {
}
