package com.example.lms.lessons.mapper;

import com.example.lms.lessons.dto.LessonResponse;
import com.example.lms.lessons.entity.Lesson;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface LessonMapper {
    LessonResponse toResponse(Lesson lesson);
}
