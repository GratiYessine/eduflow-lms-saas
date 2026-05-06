package com.example.lms.progress.entity;

import com.example.lms.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "lesson_progress", uniqueConstraints = @UniqueConstraint(name = "uk_lesson_progress_learner_lesson", columnNames = {"learner_id", "lesson_id"}))
public class LessonProgress extends BaseEntity {

    @Column(nullable = false)
    private Long learnerId;

    @Column(nullable = false)
    private Long lessonId;

    @Column(nullable = false)
    private boolean completed;

    private Instant completedAt;
}
