package com.example.lms.assignments.dto;

import com.example.lms.assignments.entity.AssignmentStatus;

import java.time.Instant;
import java.time.LocalDate;

public record AssignmentResponse(
        Long id,
        Long trainingId,
        Long companyId,
        Long teamId,
        Long learnerId,
        Long assignedBy,
        LocalDate dueDate,
        AssignmentStatus status,
        Instant createdAt
) {
}
