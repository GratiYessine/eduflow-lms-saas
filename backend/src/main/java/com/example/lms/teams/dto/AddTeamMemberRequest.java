package com.example.lms.teams.dto;

import com.example.lms.users.entity.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record AddTeamMemberRequest(
        @NotBlank @Email String email,
        @NotBlank @Size(max = 80) String firstName,
        @NotBlank @Size(max = 80) String lastName,
        @NotNull Role role,
        @Size(max = 120) String position
) {
}
