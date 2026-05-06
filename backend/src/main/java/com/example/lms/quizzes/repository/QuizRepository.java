package com.example.lms.quizzes.repository;

import com.example.lms.quizzes.entity.Quiz;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface QuizRepository extends JpaRepository<Quiz, Long> {
    Optional<Quiz> findByLessonId(Long lessonId);

    List<Quiz> findByLessonIdIn(Collection<Long> lessonIds);
}
