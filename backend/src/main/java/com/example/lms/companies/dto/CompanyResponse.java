package com.example.lms.companies.dto;

import com.example.lms.companies.entity.CompanyStatus;

import java.time.Instant;

public record CompanyResponse(
        Long id,
        String name,
        String industry,
        String website,
        String logoUrl,
        String size,
        String subscriptionPlan,
        CompanyStatus status,
        Instant createdAt
) {
}
