package com.example.lms.trainings.controller;

import com.example.lms.common.dto.ApiResponse;
import com.example.lms.common.dto.PageResponse;
import com.example.lms.lessons.dto.LessonCreateRequest;
import com.example.lms.lessons.dto.LessonResponse;
import com.example.lms.lessons.service.LessonService;
import com.example.lms.trainings.dto.TrainingCreateRequest;
import com.example.lms.trainings.dto.TrainingResponse;
import com.example.lms.trainings.dto.TrainingUpdateRequest;
import com.example.lms.trainings.entity.TrainingLevel;
import com.example.lms.trainings.entity.TrainingStatus;
import com.example.lms.trainings.service.TrainingService;
import com.example.lms.users.dto.TrainerLearnerResponse;
import com.example.lms.users.service.TrainerWorkspaceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/trainings")
@RequiredArgsConstructor
public class TrainingController {

    private final TrainingService trainingService;
    private final LessonService lessonService;
    private final TrainerWorkspaceService trainerWorkspaceService;

    @PostMapping
    public ApiResponse<TrainingResponse> create(@Valid @RequestBody TrainingCreateRequest request) {
        return ApiResponse.success("Training created successfully", trainingService.create(request));
    }

    @GetMapping
    public ApiResponse<PageResponse<TrainingResponse>> search(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) TrainingLevel level,
            @RequestParam(required = false) Long trainerId,
            @RequestParam(required = false) TrainingStatus status,
            @RequestParam(required = false) String q,
            Pageable pageable
    ) {
        return ApiResponse.success("Trainings loaded successfully", trainingService.search(category, level, trainerId, status, q, pageable));
    }

    @GetMapping("/{id}")
    public ApiResponse<TrainingResponse> get(@PathVariable Long id) {
        return ApiResponse.success("Training loaded successfully", trainingService.get(id));
    }

    @GetMapping("/{id}/lessons")
    public ApiResponse<java.util.List<LessonResponse>> lessons(@PathVariable Long id) {
        return ApiResponse.success("Lessons loaded successfully", lessonService.listByTraining(id));
    }

    @GetMapping("/{id}/learners")
    @PreAuthorize("hasAnyRole('TRAINER','SUPER_ADMIN')")
    public ApiResponse<java.util.List<TrainerLearnerResponse>> learners(@PathVariable Long id) {
        return ApiResponse.success("Training learners loaded successfully", trainerWorkspaceService.learnersForTraining(id));
    }

    @PutMapping("/{id}")
    public ApiResponse<TrainingResponse> update(@PathVariable Long id, @Valid @RequestBody TrainingUpdateRequest request) {
        return ApiResponse.success("Training updated successfully", trainingService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        trainingService.delete(id);
        return ApiResponse.success("Training deleted successfully");
    }

    @PatchMapping("/{id}/publish")
    public ApiResponse<TrainingResponse> publish(@PathVariable Long id) {
        return ApiResponse.success("Training published successfully", trainingService.publish(id));
    }

    @PatchMapping("/{id}/archive")
    public ApiResponse<TrainingResponse> archive(@PathVariable Long id) {
        return ApiResponse.success("Training archived successfully", trainingService.archive(id));
    }

    @PostMapping("/{id}/lessons")
    public ApiResponse<LessonResponse> addLesson(@PathVariable Long id, @Valid @RequestBody LessonCreateRequest request) {
        return ApiResponse.success("Lesson created successfully", lessonService.create(id, request));
    }
}
