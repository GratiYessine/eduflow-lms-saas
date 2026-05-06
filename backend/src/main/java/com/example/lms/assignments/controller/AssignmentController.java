package com.example.lms.assignments.controller;

import com.example.lms.assignments.dto.AssignmentRequest;
import com.example.lms.assignments.dto.AssignmentResponse;
import com.example.lms.assignments.dto.BulkAssignmentRequest;
import com.example.lms.assignments.service.AssignmentService;
import com.example.lms.common.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/assignments")
@RequiredArgsConstructor
public class AssignmentController {

    private final AssignmentService assignmentService;

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','COMPANY_ADMIN','TEAM_MANAGER')")
    public ApiResponse<AssignmentResponse> assign(@Valid @RequestBody AssignmentRequest request) {
        return ApiResponse.success("Training assigned successfully", assignmentService.assign(request));
    }

    @PostMapping("/bulk")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','COMPANY_ADMIN','TEAM_MANAGER')")
    public ApiResponse<List<AssignmentResponse>> assignBulk(@Valid @RequestBody BulkAssignmentRequest request) {
        return ApiResponse.success("Training assignments created successfully", assignmentService.assignBulk(request));
    }

    @GetMapping("/my")
    public ApiResponse<List<AssignmentResponse>> myAssignments() {
        return ApiResponse.success("Assignments loaded successfully", assignmentService.myAssignments());
    }
}
