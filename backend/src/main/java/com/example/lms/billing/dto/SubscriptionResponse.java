package com.example.lms.billing.dto;

import com.example.lms.billing.entity.SubscriptionStatus;

import java.time.Instant;

public record SubscriptionResponse(
        Long id,
        Long companyId,
        Long planId,
        SubscriptionStatus status,
        Instant startedAt,
        Instant expiresAt
) {
}
