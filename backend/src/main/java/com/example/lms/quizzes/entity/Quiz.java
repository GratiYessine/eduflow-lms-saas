package com.example.lms.quizzes.entity;

import com.example.lms.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "quizzes")
public class Quiz extends BaseEntity {

    @Column(nullable = false)
    private Long lessonId;

    @Column(nullable = false, length = 220)
    private String title;

    @Column(nullable = false)
    private int passingScore;

    @Column(nullable = false)
    private int maxAttempts;

    @Column(nullable = false)
    private boolean published;
}
