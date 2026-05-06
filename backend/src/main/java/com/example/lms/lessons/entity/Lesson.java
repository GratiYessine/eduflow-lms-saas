package com.example.lms.lessons.entity;

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
@Table(name = "lessons")
public class Lesson extends BaseEntity {

    @Column(nullable = false)
    private Long trainingId;

    @Column(nullable = false, length = 220)
    private String title;

    @Column(columnDefinition = "text")
    private String content;

    private String videoUrl;

    @Column(nullable = false)
    private int durationMinutes;

    @Column(nullable = false)
    private int orderIndex;

    @Column(nullable = false)
    private boolean preview;
}
