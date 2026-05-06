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
@Table(name = "lesson_resources")
public class LessonResource extends BaseEntity {

    @Column(nullable = false)
    private Long lessonId;

    @Column(nullable = false)
    private Long fileId;

    @Column(nullable = false, length = 1000)
    private String fileUrl;

    @Column(nullable = false, length = 120)
    private String fileType;

    @Column(nullable = false)
    private String originalName;

    @Column(nullable = false)
    private long size;
}
