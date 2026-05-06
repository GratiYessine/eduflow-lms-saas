package com.example.lms.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record ResetPasswordRequest(
        @NotBlank
        @jakarta.validation.constraints.Email
        String email,
        @NotBlank
        @Pattern(regexp = "^\\d{6}$", message = "Code must contain 6 digits")
        String code,
        @NotBlank
        @Pattern(
                regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$",
                message = "Password must contain at least 8 characters, one uppercase, one lowercase and one digit"
        )
        String newPassword
) {
}
