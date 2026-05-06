package com.example.lms.users.mapper;

import com.example.lms.users.dto.TrainerProfileResponse;
import com.example.lms.users.dto.UserResponse;
import com.example.lms.users.entity.TrainerProfile;
import com.example.lms.users.entity.User;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface UserMapper {
    UserResponse toResponse(User user);

    TrainerProfileResponse toResponse(TrainerProfile profile);
}
