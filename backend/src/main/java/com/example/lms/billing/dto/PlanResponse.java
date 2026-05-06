package com.example.lms.billing.dto;

import java.math.BigDecimal;

public record PlanResponse(
        Long id,
        String name,
        BigDecimal price,
        int maxUsers,
        int maxTeams,
        int maxTrainings,
        String features
) {
}
