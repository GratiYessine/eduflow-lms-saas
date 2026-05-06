package com.example.lms.trainings.entity;

import com.example.lms.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "trainings")
public class Training extends BaseEntity {

    @Column(nullable = false)
    private Long trainerId;

    @Column(nullable = false, length = 220)
    private String title;

    @Column(nullable = false, unique = true, length = 260)
    private String slug;

    @Column(length = 500)
    private String shortDescription;

    @Column(columnDefinition = "text")
    private String description;

    private String thumbnailUrl;

    private String introVideoUrl;

    @Column(length = 120)
    private String category;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private TrainingLevel level;

    @Column(nullable = false, length = 20)
    private String language = "en";

    @Column(nullable = false)
    private int durationMinutes;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal price = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private TrainingStatus status = TrainingStatus.DRAFT;
}
