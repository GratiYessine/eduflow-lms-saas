package com.example.lms.progress.controller;

import com.example.lms.common.dto.ApiResponse;
import com.example.lms.progress.dto.ProgressResponse;
import com.example.lms.progress.dto.QuizAttemptResponse;
import com.example.lms.progress.service.ProgressService;
import com.example.lms.quizzes.dto.QuizSubmitRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class ProgressController {

    private final ProgressService progressService;

    @GetMapping("/api/v1/progress/my")
    public ApiResponse<List<ProgressResponse>> myProgress() {
        return ApiResponse.success("Progress loaded successfully", progressService.myProgress());
    }

    @PostMapping("/api/v1/lessons/{id}/complete")
    @PreAuthorize("hasRole('LEARNER') or hasRole('TEAM_MANAGER') or hasRole('COMPANY_ADMIN')")
    public ApiResponse<ProgressResponse> completeLesson(@PathVariable Long id) {
        return ApiResponse.success("Lesson completed successfully", progressService.completeLesson(id));
    }

    @PostMapping("/api/v1/quizzes/{id}/submit")
    @PreAuthorize("hasRole('LEARNER') or hasRole('TEAM_MANAGER') or hasRole('COMPANY_ADMIN')")
    public ApiResponse<QuizAttemptResponse> submitQuiz(@PathVariable Long id, @Valid @RequestBody QuizSubmitRequest request) {
        return ApiResponse.success("Quiz submitted successfully", progressService.submitQuiz(id, request));
    }

    @PatchMapping("/api/v1/progress/{id}/approve")
    @PreAuthorize("hasAnyRole('TRAINER','SUPER_ADMIN')")
    public ApiResponse<ProgressResponse> approve(@PathVariable Long id) {
        return ApiResponse.success("Progress approved successfully", progressService.approve(id));
    }

    @PatchMapping("/api/v1/progress/{id}/reject")
    @PreAuthorize("hasAnyRole('TRAINER','SUPER_ADMIN')")
    public ApiResponse<ProgressResponse> reject(@PathVariable Long id) {
        return ApiResponse.success("Progress rejected successfully", progressService.reject(id));
    }
}
