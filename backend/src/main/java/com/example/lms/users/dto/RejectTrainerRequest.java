package com.example.lms.users.dto;

import jakarta.validation.constraints.Size;

public record RejectTrainerRequest(
        @Size(max = 1000) String reason
) {
}
