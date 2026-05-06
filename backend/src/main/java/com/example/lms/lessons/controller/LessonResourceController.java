package com.example.lms.lessons.controller;

import com.example.lms.common.dto.ApiResponse;
import com.example.lms.lessons.dto.LessonResourceResponse;
import com.example.lms.lessons.service.LessonResourceService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class LessonResourceController {

    private final LessonResourceService lessonResourceService;

    @PostMapping("/lessons/{lessonId}/resources")
    @PreAuthorize("hasAnyRole('TRAINER','SUPER_ADMIN')")
    public ApiResponse<LessonResourceResponse> upload(@PathVariable Long lessonId, @RequestParam("file") MultipartFile file) {
        return ApiResponse.success("Lesson resource uploaded successfully", lessonResourceService.upload(lessonId, file));
    }

    @GetMapping("/lessons/{lessonId}/resources")
    public ApiResponse<List<LessonResourceResponse>> list(@PathVariable Long lessonId) {
        return ApiResponse.success("Lesson resources loaded successfully", lessonResourceService.list(lessonId));
    }

    @DeleteMapping("/lesson-resources/{id}")
    @PreAuthorize("hasAnyRole('TRAINER','SUPER_ADMIN')")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        lessonResourceService.delete(id);
        return ApiResponse.success("Lesson resource deleted successfully");
    }
}
