package com.example.lms.auth.mapper;

import com.example.lms.auth.dto.AuthResponse;
import com.example.lms.users.dto.UserResponse;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface AuthMapper {
    default AuthResponse toAuthResponse(String accessToken, String refreshToken, UserResponse user) {
        return new AuthResponse(accessToken, refreshToken, "Bearer", user);
    }
}
