package com.example.lms.users.service;

import com.example.lms.common.exception.BadRequestException;
import com.example.lms.common.exception.ResourceNotFoundException;
import com.example.lms.security.SecurityUtils;
import com.example.lms.users.dto.TrainerProfileResponse;
import com.example.lms.users.dto.UpdateTrainerProfileRequest;
import com.example.lms.users.entity.Role;
import com.example.lms.users.entity.TrainerProfile;
import com.example.lms.users.entity.User;
import com.example.lms.users.mapper.UserMapper;
import com.example.lms.users.repository.TrainerProfileRepository;
import com.example.lms.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class TrainerProfileService {

    private final TrainerProfileRepository trainerProfileRepository;
    private final UserRepository userRepository;
    private final UserMapper userMapper;

    @Transactional(readOnly = true)
    public TrainerProfileResponse getTrainer(Long id) {
        User user = userRepository.findById(id)
                .filter(found -> found.getRole() == Role.TRAINER)
                .orElseThrow(() -> new ResourceNotFoundException("Trainer not found"));
        TrainerProfile profile = trainerProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Trainer profile not found"));
        return userMapper.toResponse(profile);
    }

    @Transactional
    @PreAuthorize("hasRole('TRAINER')")
    public TrainerProfileResponse updateProfile(UpdateTrainerProfileRequest request) {
        Long userId = SecurityUtils.currentUserId();
        if (userId == null) {
            throw new BadRequestException("Authenticated user is required");
        }
        TrainerProfile profile = trainerProfileRepository.findByUserId(userId)
                .orElseGet(() -> {
                    TrainerProfile created = new TrainerProfile();
                    created.setUserId(userId);
                    return created;
                });
        profile.setBio(request.bio());
        profile.setExpertise(request.expertise());
        profile.setPortfolioUrl(request.portfolioUrl());
        profile.setSocialLinks(request.socialLinks());
        profile.setMotivation(request.motivation());
        profile.setCvUrl(request.cvUrl());
        profile.setCertificateUrl(request.certificateUrl());
        profile.setDiplomaUrl(request.diplomaUrl());
        return userMapper.toResponse(trainerProfileRepository.save(profile));
    }
}
