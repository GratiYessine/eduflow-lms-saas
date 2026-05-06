package com.example.lms.lessons.service;

import com.example.lms.common.exception.ResourceNotFoundException;
import com.example.lms.lessons.dto.LessonCreateRequest;
import com.example.lms.lessons.dto.LessonResponse;
import com.example.lms.lessons.dto.LessonUpdateRequest;
import com.example.lms.lessons.entity.Lesson;
import com.example.lms.lessons.mapper.LessonMapper;
import com.example.lms.lessons.repository.LessonRepository;
import com.example.lms.trainings.service.TrainingService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class LessonService {

    private final LessonRepository lessonRepository;
    private final LessonMapper lessonMapper;
    private final TrainingService trainingService;

    @Transactional(readOnly = true)
    public List<LessonResponse> listByTraining(Long trainingId) {
        trainingService.get(trainingId);
        return lessonRepository.findByTrainingIdOrderByOrderIndexAsc(trainingId)
                .stream()
                .map(lessonMapper::toResponse)
                .toList();
    }

    @Transactional
    @PreAuthorize("hasRole('SUPER_ADMIN') or @tenantSecurity.isTrainingOwner(#trainingId)")
    public LessonResponse create(Long trainingId, LessonCreateRequest request) {
        trainingService.ownedTraining(trainingId);
        Lesson lesson = new Lesson();
        lesson.setTrainingId(trainingId);
        lesson.setTitle(request.title().trim());
        lesson.setContent(request.content());
        lesson.setVideoUrl(request.videoUrl());
        lesson.setDurationMinutes(request.durationMinutes());
        lesson.setOrderIndex(request.orderIndex());
        lesson.setPreview(request.preview());
        return lessonMapper.toResponse(lessonRepository.save(lesson));
    }

    @Transactional
    public LessonResponse update(Long id, LessonUpdateRequest request) {
        Lesson lesson = lessonRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Lesson not found"));
        trainingService.ownedTraining(lesson.getTrainingId());
        if (request.title() != null && !request.title().isBlank()) {
            lesson.setTitle(request.title().trim());
        }
        lesson.setContent(request.content());
        lesson.setVideoUrl(request.videoUrl());
        if (request.durationMinutes() != null) {
            lesson.setDurationMinutes(request.durationMinutes());
        }
        if (request.orderIndex() != null) {
            lesson.setOrderIndex(request.orderIndex());
        }
        if (request.preview() != null) {
            lesson.setPreview(request.preview());
        }
        return lessonMapper.toResponse(lesson);
    }

    @Transactional
    public void delete(Long id) {
        Lesson lesson = lessonRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Lesson not found"));
        trainingService.ownedTraining(lesson.getTrainingId());
        lessonRepository.delete(lesson);
    }
}
