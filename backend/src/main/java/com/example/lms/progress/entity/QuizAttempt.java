package com.example.lms.progress.entity;

import com.example.lms.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "quiz_attempts")
public class QuizAttempt extends BaseEntity {

    @Column(nullable = false)
    private Long learnerId;

    @Column(nullable = false)
    private Long quizId;

    @Column(nullable = false)
    private int score;

    @Column(nullable = false)
    private boolean passed;

    @Column(nullable = false)
    private int attemptNumber;

    @Column(nullable = false)
    private Instant submittedAt = Instant.now();
}
