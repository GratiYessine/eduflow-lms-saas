package com.example.lms.progress.entity;

import com.example.lms.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "learner_progress", uniqueConstraints = @UniqueConstraint(name = "uk_progress_learner_training", columnNames = {"learner_id", "training_id"}))
public class LearnerProgress extends BaseEntity {

    @Column(nullable = false)
    private Long learnerId;

    @Column(nullable = false)
    private Long trainingId;

    @Column(nullable = false)
    private int completedLessons;

    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal progressPercentage = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private ProgressStatus status = ProgressStatus.NOT_STARTED;

    private Instant startedAt;

    private Instant completedAt;

    private Instant approvedAt;

    private Long approvedBy;
}
