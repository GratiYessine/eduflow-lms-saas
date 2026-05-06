package com.example.lms.assignments.dto;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record AssignmentRequest(
        @NotNull Long trainingId,
        Long companyId,
        Long teamId,
        Long learnerId,
        LocalDate dueDate
) {
}
