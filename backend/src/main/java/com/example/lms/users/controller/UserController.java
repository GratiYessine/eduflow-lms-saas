package com.example.lms.users.controller;

import com.example.lms.common.dto.ApiResponse;
import com.example.lms.common.dto.PageResponse;
import com.example.lms.users.dto.ChangePasswordRequest;
import com.example.lms.users.dto.CreateUserRequest;
import com.example.lms.users.dto.UpdateProfileRequest;
import com.example.lms.users.dto.UserResponse;
import com.example.lms.users.entity.Role;
import com.example.lms.users.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public ApiResponse<UserResponse> me() {
        return ApiResponse.success("Current user loaded", userService.me());
    }

    @GetMapping
    public ApiResponse<PageResponse<UserResponse>> list(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Role role,
            @RequestParam(required = false) Long companyId,
            Pageable pageable
    ) {
        return ApiResponse.success("Users loaded successfully", userService.list(q, role, companyId, pageable));
    }

    @PostMapping
    public ApiResponse<UserResponse> create(@Valid @RequestBody CreateUserRequest request) {
        return ApiResponse.success("User created successfully", userService.create(request));
    }

    @PutMapping("/me")
    public ApiResponse<UserResponse> updateMe(@Valid @RequestBody UpdateProfileRequest request) {
        return ApiResponse.success("Profile updated successfully", userService.updateMe(request));
    }

    @PutMapping("/change-password")
    public ApiResponse<Void> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        userService.changePassword(request);
        return ApiResponse.success("Password changed successfully");
    }

    @PostMapping("/change-password/code")
    public ApiResponse<Void> sendChangePasswordCode() {
        userService.sendChangePasswordCode();
        return ApiResponse.success("Password change code sent successfully");
    }
}
