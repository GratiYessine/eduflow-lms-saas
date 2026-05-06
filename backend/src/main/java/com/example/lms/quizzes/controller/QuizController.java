package com.example.lms.quizzes.controller;

import com.example.lms.common.dto.ApiResponse;
import com.example.lms.quizzes.dto.QuizCreateRequest;
import com.example.lms.quizzes.dto.QuizResponse;
import com.example.lms.quizzes.service.QuizService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/quizzes")
@RequiredArgsConstructor
public class QuizController {

    private final QuizService quizService;

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('TRAINER','SUPER_ADMIN')")
    public ApiResponse<QuizResponse> update(@PathVariable Long id, @Valid @RequestBody QuizCreateRequest request) {
        return ApiResponse.success("Quiz updated successfully", quizService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('TRAINER','SUPER_ADMIN')")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        quizService.delete(id);
        return ApiResponse.success("Quiz deleted successfully");
    }

    @PatchMapping("/{id}/publish")
    @PreAuthorize("hasAnyRole('TRAINER','SUPER_ADMIN')")
    public ApiResponse<QuizResponse> publish(@PathVariable Long id) {
        return ApiResponse.success("Quiz published successfully", quizService.publish(id));
    }

    @PatchMapping("/{id}/unpublish")
    @PreAuthorize("hasAnyRole('TRAINER','SUPER_ADMIN')")
    public ApiResponse<QuizResponse> unpublish(@PathVariable Long id) {
        return ApiResponse.success("Quiz unpublished successfully", quizService.unpublish(id));
    }
}
