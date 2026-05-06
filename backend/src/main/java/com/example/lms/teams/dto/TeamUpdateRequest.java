package com.example.lms.teams.dto;

import jakarta.validation.constraints.Size;

public record TeamUpdateRequest(
        @Size(max = 140) String name,
        Long managerId,
        @Size(max = 3000) String description
) {
}
