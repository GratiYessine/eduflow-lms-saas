package com.example.lms.lessons.controller;

import com.example.lms.common.dto.ApiResponse;
import com.example.lms.lessons.dto.LessonResponse;
import com.example.lms.lessons.dto.LessonUpdateRequest;
import com.example.lms.lessons.service.LessonService;
import com.example.lms.quizzes.dto.QuizCreateRequest;
import com.example.lms.quizzes.dto.QuizResponse;
import com.example.lms.quizzes.service.QuizService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/lessons")
@RequiredArgsConstructor
public class LessonController {

    private final LessonService lessonService;
    private final QuizService quizService;

    @PutMapping("/{id}")
    public ApiResponse<LessonResponse> update(@PathVariable Long id, @Valid @RequestBody LessonUpdateRequest request) {
        return ApiResponse.success("Lesson updated successfully", lessonService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        lessonService.delete(id);
        return ApiResponse.success("Lesson deleted successfully");
    }

    @PostMapping("/{id}/quiz")
    public ApiResponse<QuizResponse> createQuiz(@PathVariable Long id, @Valid @RequestBody QuizCreateRequest request) {
        return ApiResponse.success("Quiz created successfully", quizService.create(id, request));
    }

    @GetMapping("/{id}/quiz")
    public ApiResponse<QuizResponse> quiz(@PathVariable Long id) {
        return ApiResponse.success("Quiz loaded successfully", quizService.getByLesson(id));
    }
}
