package com.example.lms.progress.repository;

import com.example.lms.progress.entity.QuizAttempt;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface QuizAttemptRepository extends JpaRepository<QuizAttempt, Long> {
    long countByLearnerIdAndQuizId(Long learnerId, Long quizId);

    List<QuizAttempt> findByLearnerIdAndQuizIdIn(Long learnerId, Collection<Long> quizIds);

    void deleteByQuizId(Long quizId);
}
