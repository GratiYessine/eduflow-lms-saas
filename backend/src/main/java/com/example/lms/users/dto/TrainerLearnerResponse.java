package com.example.lms.users.dto;

import java.math.BigDecimal;

public record TrainerLearnerResponse(
        Long learnerId,
        String firstName,
        String lastName,
        String email,
        Long trainingId,
        String trainingTitle,
        String assignmentStatus,
        Long progressId,
        String progressStatus,
        BigDecimal progressPercentage,
        Integer quizScore,
        String certificateStatus
) {
}
