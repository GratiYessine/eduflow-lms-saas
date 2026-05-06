package com.example.lms.users.controller;

import com.example.lms.common.dto.ApiResponse;
import com.example.lms.users.dto.RejectTrainerRequest;
import com.example.lms.users.dto.TrainerApplicationResponse;
import com.example.lms.users.entity.TrainerVerificationStatus;
import com.example.lms.users.service.TrainerApprovalService;
import com.example.lms.users.service.TrainerApplicationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/trainers")
@RequiredArgsConstructor
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class AdminTrainerController {

    private final TrainerApplicationService trainerApplicationService;
    private final TrainerApprovalService trainerApprovalService;

    @GetMapping("/pending")
    public ApiResponse<List<TrainerApplicationResponse>> pending() {
        return ApiResponse.success("Pending trainer applications loaded", trainerApplicationService.pending());
    }

    @GetMapping("/applications")
    public ApiResponse<List<TrainerApplicationResponse>> applications(@RequestParam(required = false) TrainerVerificationStatus status) {
        return ApiResponse.success("Trainer applications loaded", trainerApplicationService.listApplications(status));
    }

    @PatchMapping("/{trainerId}/approve")
    public ApiResponse<TrainerApplicationResponse> approve(@PathVariable Long trainerId) {
        return ApiResponse.success("Trainer application approved", trainerApprovalService.approve(trainerId));
    }

    @PatchMapping("/{trainerId}/reject")
    public ApiResponse<TrainerApplicationResponse> reject(@PathVariable Long trainerId, @Valid @RequestBody(required = false) RejectTrainerRequest request) {
        return ApiResponse.success("Trainer application rejected", trainerApprovalService.reject(trainerId, request == null ? null : request.reason()));
    }
}
