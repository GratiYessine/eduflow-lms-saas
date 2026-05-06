package com.example.lms.assignments.dto;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.List;

public record BulkAssignmentRequest(
        @NotNull Long trainingId,
        Long companyId,
        @NotNull AssignmentTargetType targetType,
        List<Long> teamIds,
        List<Long> learnerIds,
        LocalDate dueDate
) {
}
