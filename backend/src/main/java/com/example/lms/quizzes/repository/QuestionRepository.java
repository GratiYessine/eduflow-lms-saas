package com.example.lms.quizzes.repository;

import com.example.lms.quizzes.entity.Question;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuestionRepository extends JpaRepository<Question, Long> {
    List<Question> findByQuizIdOrderByOrderIndexAsc(Long quizId);

    void deleteByQuizId(Long quizId);
}
