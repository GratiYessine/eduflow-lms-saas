package com.example.lms.lessons.service;

import com.example.lms.common.exception.ResourceNotFoundException;
import com.example.lms.files.dto.FileResponse;
import com.example.lms.files.entity.FileCategory;
import com.example.lms.files.service.FileStorageService;
import com.example.lms.lessons.dto.LessonResourceResponse;
import com.example.lms.lessons.entity.Lesson;
import com.example.lms.lessons.entity.LessonResource;
import com.example.lms.lessons.repository.LessonRepository;
import com.example.lms.lessons.repository.LessonResourceRepository;
import com.example.lms.trainings.service.TrainingService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Service
@RequiredArgsConstructor
public class LessonResourceService {

    private final LessonRepository lessonRepository;
    private final LessonResourceRepository lessonResourceRepository;
    private final FileStorageService fileStorageService;
    private final TrainingService trainingService;

    @Transactional
    public LessonResourceResponse upload(Long lessonId, MultipartFile file) {
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new ResourceNotFoundException("Lesson not found"));
        trainingService.ownedTraining(lesson.getTrainingId());
        FileResponse uploaded = fileStorageService.store(file, FileCategory.OTHER);

        LessonResource resource = new LessonResource();
        resource.setLessonId(lessonId);
        resource.setFileId(uploaded.id());
        resource.setFileUrl(uploaded.url());
        resource.setFileType(uploaded.contentType());
        resource.setOriginalName(uploaded.originalFilename());
        resource.setSize(uploaded.size());
        return toResponse(lessonResourceRepository.save(resource));
    }

    @Transactional(readOnly = true)
    public List<LessonResourceResponse> list(Long lessonId) {
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new ResourceNotFoundException("Lesson not found"));
        trainingService.get(lesson.getTrainingId());
        return lessonResourceRepository.findByLessonIdOrderByCreatedAtDesc(lessonId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public void delete(Long id) {
        LessonResource resource = lessonResourceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Lesson resource not found"));
        Lesson lesson = lessonRepository.findById(resource.getLessonId())
                .orElseThrow(() -> new ResourceNotFoundException("Lesson not found"));
        trainingService.ownedTraining(lesson.getTrainingId());
        lessonResourceRepository.delete(resource);
    }

    private LessonResourceResponse toResponse(LessonResource resource) {
        return new LessonResourceResponse(
                resource.getId(),
                resource.getLessonId(),
                resource.getFileId(),
                resource.getFileUrl(),
                resource.getFileType(),
                resource.getOriginalName(),
                resource.getSize(),
                resource.getCreatedAt()
        );
    }
}
