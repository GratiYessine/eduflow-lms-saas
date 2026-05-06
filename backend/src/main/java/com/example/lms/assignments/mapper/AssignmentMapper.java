package com.example.lms.assignments.mapper;

import com.example.lms.assignments.dto.AssignmentResponse;
import com.example.lms.assignments.entity.TrainingAssignment;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface AssignmentMapper {
    AssignmentResponse toResponse(TrainingAssignment assignment);
}
