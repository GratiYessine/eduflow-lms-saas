package com.example.lms.lessons.repository;

import com.example.lms.lessons.entity.LessonResource;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LessonResourceRepository extends JpaRepository<LessonResource, Long> {
    List<LessonResource> findByLessonIdOrderByCreatedAtDesc(Long lessonId);
}
