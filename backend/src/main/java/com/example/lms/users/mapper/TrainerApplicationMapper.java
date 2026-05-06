package com.example.lms.users.mapper;

import com.example.lms.users.dto.TrainerApplicationResponse;
import com.example.lms.users.entity.TrainerProfile;
import com.example.lms.users.entity.User;
import org.springframework.stereotype.Component;

@Component
public class TrainerApplicationMapper {

    public TrainerApplicationResponse toResponse(User user, TrainerProfile profile) {
        return new TrainerApplicationResponse(
                user.getId(),
                profile.getId(),
                user.getFirstName(),
                user.getLastName(),
                user.getEmail(),
                user.getPhone(),
                user.getStatus().name(),
                profile.getVerificationStatus().name(),
                profile.getExpertise(),
                profile.getBio(),
                profile.getPortfolioUrl(),
                profile.getSocialLinks(),
                profile.getMotivation(),
                profile.getCvUrl(),
                profile.getCertificateUrl(),
                profile.getDiplomaUrl(),
                profile.getRejectionReason(),
                profile.getApprovedAt(),
                profile.getApprovedBy(),
                profile.getCreatedAt()
        );
    }
}
