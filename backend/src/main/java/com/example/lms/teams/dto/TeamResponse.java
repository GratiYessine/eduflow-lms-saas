package com.example.lms.teams.dto;

import java.time.Instant;
import java.util.List;

public record TeamResponse(
        Long id,
        String name,
        Long companyId,
        Long managerId,
        String description,
        Instant createdAt,
        List<TeamMemberResponse> members
) {
}
