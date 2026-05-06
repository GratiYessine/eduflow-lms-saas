package com.example.lms.quizzes.mapper;

import com.example.lms.quizzes.dto.AnswerOptionResponse;
import com.example.lms.quizzes.entity.AnswerOption;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface QuizMapper {
    @Mapping(target = "text", source = "text")
    @Mapping(target = "correct", expression = "java(null)")
    AnswerOptionResponse toPublicAnswer(AnswerOption answerOption);
}
