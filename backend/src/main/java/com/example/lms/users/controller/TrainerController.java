package com.example.lms.users.controller;

import com.example.lms.common.dto.ApiResponse;
import com.example.lms.users.dto.TrainerApprovalResponse;
import com.example.lms.users.dto.TrainerLearnerResponse;
import com.example.lms.users.dto.TrainerProfileResponse;
import com.example.lms.users.dto.TrainerWalletResponse;
import com.example.lms.users.dto.UpdateTrainerProfileRequest;
import com.example.lms.users.service.TrainerProfileService;
import com.example.lms.users.service.TrainerWorkspaceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/trainers")
@RequiredArgsConstructor
public class TrainerController {

    private final TrainerProfileService trainerProfileService;
    private final TrainerWorkspaceService trainerWorkspaceService;

    @GetMapping("/{id}")
    public ApiResponse<TrainerProfileResponse> getTrainer(@PathVariable Long id) {
        return ApiResponse.success("Trainer profile loaded", trainerProfileService.getTrainer(id));
    }

    @PutMapping("/profile")
    @PreAuthorize("hasRole('TRAINER')")
    public ApiResponse<TrainerProfileResponse> updateProfile(@Valid @RequestBody UpdateTrainerProfileRequest request) {
        return ApiResponse.success("Trainer profile updated", trainerProfileService.updateProfile(request));
    }

    @GetMapping("/me/learners")
    @PreAuthorize("hasRole('TRAINER')")
    public ApiResponse<java.util.List<TrainerLearnerResponse>> myLearners() {
        return ApiResponse.success("Trainer learners loaded", trainerWorkspaceService.myLearners());
    }

    @GetMapping("/me/approvals")
    @PreAuthorize("hasRole('TRAINER')")
    public ApiResponse<java.util.List<TrainerApprovalResponse>> myApprovals() {
        return ApiResponse.success("Trainer approvals loaded", trainerWorkspaceService.myApprovals());
    }

    @GetMapping("/me/wallet")
    @PreAuthorize("hasRole('TRAINER')")
    public ApiResponse<TrainerWalletResponse> wallet() {
        return ApiResponse.success("Trainer wallet loaded", trainerWorkspaceService.wallet());
    }
}
