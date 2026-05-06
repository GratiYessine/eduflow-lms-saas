package com.example.lms.companies.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CompanyCreateRequest(
        @NotBlank @Size(max = 180) String name,
        @Size(max = 120) String industry,
        String website,
        String logoUrl,
        @Size(max = 80) String size
) {
}
