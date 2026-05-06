package com.example.lms.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.springframework.web.multipart.MultipartFile;

@Getter
@Setter
public class RegisterTrainerRequest {
    @NotBlank
    @Size(max = 80)
    private String firstName;

    @NotBlank
    @Size(max = 80)
    private String lastName;

    @NotBlank
    @Email
    private String email;

    @Size(max = 40)
    private String phone;

    @NotBlank
    @Pattern(
            regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$",
            message = "Password must contain at least 8 characters, one uppercase, one lowercase and one digit"
    )
    private String password;

    @NotBlank
    private String confirmPassword;

    @NotBlank
    @Size(max = 3000)
    private String specialty;

    @NotBlank
    @Size(max = 5000)
    private String bio;

    private String portfolioUrl;

    @Size(max = 3000)
    private String socialLinks;

    @NotBlank
    @Size(max = 5000)
    private String motivation;

    @NotNull
    private MultipartFile cv;

    private MultipartFile certificate;

    private MultipartFile diploma;
}
