package com.example.lms.progress.repository;

import com.example.lms.progress.entity.LessonProgress;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.Optional;

public interface LessonProgressRepository extends JpaRepository<LessonProgress, Long> {
    Optional<LessonProgress> findByLearnerIdAndLessonId(Long learnerId, Long lessonId);

    long countByLearnerIdAndCompletedTrueAndLessonIdIn(Long learnerId, Collection<Long> lessonIds);
}
