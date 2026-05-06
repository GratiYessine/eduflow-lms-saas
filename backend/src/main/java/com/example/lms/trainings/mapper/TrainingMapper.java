package com.example.lms.trainings.mapper;

import com.example.lms.trainings.dto.TrainingResponse;
import com.example.lms.trainings.entity.Training;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface TrainingMapper {
    TrainingResponse toResponse(Training training);
}
