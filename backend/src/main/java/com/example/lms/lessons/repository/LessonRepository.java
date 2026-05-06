package com.example.lms.lessons.repository;

import com.example.lms.lessons.entity.Lesson;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LessonRepository extends JpaRepository<Lesson, Long> {
    List<Lesson> findByTrainingIdOrderByOrderIndexAsc(Long trainingId);

    long countByTrainingId(Long trainingId);
}
