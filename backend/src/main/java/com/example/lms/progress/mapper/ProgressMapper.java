package com.example.lms.progress.mapper;

import com.example.lms.progress.dto.ProgressResponse;
import com.example.lms.progress.dto.QuizAttemptResponse;
import com.example.lms.progress.entity.LearnerProgress;
import com.example.lms.progress.entity.QuizAttempt;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface ProgressMapper {
    ProgressResponse toResponse(LearnerProgress progress);

    QuizAttemptResponse toResponse(QuizAttempt attempt);
}
