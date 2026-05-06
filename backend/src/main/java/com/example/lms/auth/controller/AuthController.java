package com.example.lms.auth.controller;

import com.example.lms.auth.dto.AuthResponse;
import com.example.lms.auth.dto.ForgotPasswordRequest;
import com.example.lms.auth.dto.LoginRequest;
import com.example.lms.auth.dto.RefreshTokenRequest;
import com.example.lms.auth.dto.RegisterRequest;
import com.example.lms.auth.dto.RegisterTrainerRequest;
import com.example.lms.auth.dto.ResetPasswordRequest;
import com.example.lms.auth.dto.VerifyEmailRequest;
import com.example.lms.auth.service.AuthService;
import com.example.lms.common.dto.ApiResponse;
import com.example.lms.teams.dto.AcceptInvitationRequest;
import com.example.lms.teams.service.InvitationService;
import com.example.lms.users.dto.TrainerApplicationResponse;
import com.example.lms.users.dto.UserResponse;
import com.example.lms.users.service.TrainerApplicationService;
import com.example.lms.users.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final InvitationService invitationService;
    private final UserService userService;
    private final TrainerApplicationService trainerApplicationService;

    @PostMapping("/register")
    public ApiResponse<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ApiResponse.success("Registration completed successfully", authService.register(request));
    }

    @PostMapping(value = "/register-trainer", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<TrainerApplicationResponse> registerTrainer(@Valid @ModelAttribute RegisterTrainerRequest request) {
        return ApiResponse.success("Trainer application submitted successfully", trainerApplicationService.register(request));
    }

    @PostMapping("/login")
    public ApiResponse<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ApiResponse.success("Login completed successfully", authService.login(request));
    }

    @PostMapping("/refresh-token")
    public ApiResponse<AuthResponse> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        return ApiResponse.success("Token refreshed successfully", authService.refresh(request));
    }

    @PostMapping("/logout")
    public ApiResponse<Void> logout(@Valid @RequestBody RefreshTokenRequest request) {
        authService.logout(request);
        return ApiResponse.success("Logged out successfully");
    }

    @PostMapping("/forgot-password")
    public ApiResponse<Void> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request);
        return ApiResponse.success("If the email exists, a password reset code will be sent");
    }

    @PostMapping("/reset-password")
    public ApiResponse<Void> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ApiResponse.success("Password reset successfully");
    }

    @PostMapping("/verify-email")
    public ApiResponse<AuthResponse> verifyEmail(@Valid @RequestBody VerifyEmailRequest request) {
        return ApiResponse.success("Email verified successfully", authService.verifyEmail(request));
    }

    @PostMapping("/resend-verification")
    public ApiResponse<Void> resendVerification(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.resendVerification(request);
        return ApiResponse.success("If the email exists and is pending, verification instructions will be sent");
    }

    @PostMapping("/accept-invitation")
    public ApiResponse<AuthResponse> acceptInvitation(@Valid @RequestBody AcceptInvitationRequest request) {
        return ApiResponse.success("Invitation accepted successfully", invitationService.acceptInvitation(request));
    }

    @GetMapping("/me")
    public ApiResponse<UserResponse> me() {
        return ApiResponse.success("Current user loaded", userService.me());
    }
}
