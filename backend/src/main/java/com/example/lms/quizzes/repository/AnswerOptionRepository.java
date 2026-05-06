package com.example.lms.quizzes.repository;

import com.example.lms.quizzes.entity.AnswerOption;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface AnswerOptionRepository extends JpaRepository<AnswerOption, Long> {
    List<AnswerOption> findByQuestionId(Long questionId);

    List<AnswerOption> findByQuestionIdIn(Collection<Long> questionIds);

    void deleteByQuestionIdIn(Collection<Long> questionIds);
}
