package com.example.lms.users.service;

import com.example.lms.auth.repository.RefreshTokenRepository;
import com.example.lms.common.exception.ResourceNotFoundException;
import com.example.lms.common.util.StringSanitizer;
import com.example.lms.notifications.entity.NotificationType;
import com.example.lms.notifications.service.EmailService;
import com.example.lms.notifications.service.NotificationService;
import com.example.lms.security.SecurityUtils;
import com.example.lms.users.dto.TrainerApplicationResponse;
import com.example.lms.users.entity.Role;
import com.example.lms.users.entity.TrainerProfile;
import com.example.lms.users.entity.TrainerVerificationStatus;
import com.example.lms.users.entity.User;
import com.example.lms.users.entity.UserStatus;
import com.example.lms.users.mapper.TrainerApplicationMapper;
import com.example.lms.users.repository.TrainerProfileRepository;
import com.example.lms.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class TrainerApprovalService {

    private final UserRepository userRepository;
    private final TrainerProfileRepository trainerProfileRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final StringSanitizer sanitizer;
    private final NotificationService notificationService;
    private final EmailService emailService;
    private final TrainerApplicationMapper trainerApplicationMapper;

    @Transactional
    public TrainerApplicationResponse approve(Long trainerId) {
        User trainer = trainerUser(trainerId);
        TrainerProfile profile = profileForTrainer(trainer.getId());
        profile.setVerificationStatus(TrainerVerificationStatus.APPROVED);
        profile.setApprovedAt(Instant.now());
        profile.setApprovedBy(SecurityUtils.currentUserId());
        profile.setRejectionReason(null);
        if (trainer.getStatus() != UserStatus.PENDING) {
            trainer.setStatus(UserStatus.ACTIVE);
        }
        trainer.setFailedLoginAttempts(0);
        trainer.setLockedUntil(null);
        trainer.setTokenVersion(trainer.getTokenVersion() + 1);
        refreshTokenRepository.revokeActiveTokensForUser(trainer.getId(), Instant.now());
        notificationService.notify(trainer.getId(), "Trainer approved", "Your trainer account has been approved.", NotificationType.TRAINER_APPLICATION);
        emailService.sendTrainerApproved(trainer.getEmail());
        return trainerApplicationMapper.toResponse(trainer, profile);
    }

    @Transactional
    public TrainerApplicationResponse reject(Long trainerId, String reason) {
        User trainer = trainerUser(trainerId);
        TrainerProfile profile = profileForTrainer(trainer.getId());
        String cleanedReason = sanitizer.clean(reason);
        profile.setVerificationStatus(TrainerVerificationStatus.REJECTED);
        profile.setRejectionReason(cleanedReason == null || cleanedReason.isBlank() ? "Application rejected by super admin." : cleanedReason);
        profile.setApprovedAt(null);
        profile.setApprovedBy(SecurityUtils.currentUserId());
        trainer.setStatus(UserStatus.SUSPENDED);
        trainer.setTokenVersion(trainer.getTokenVersion() + 1);
        refreshTokenRepository.revokeActiveTokensForUser(trainer.getId(), Instant.now());
        notificationService.notify(trainer.getId(), "Trainer application rejected", "Your trainer application was rejected.", NotificationType.TRAINER_APPLICATION);
        emailService.sendTrainerRejected(trainer.getEmail(), profile.getRejectionReason());
        return trainerApplicationMapper.toResponse(trainer, profile);
    }

    private User trainerUser(Long trainerId) {
        return userRepository.findById(trainerId)
                .filter(user -> user.getRole() == Role.TRAINER)
                .orElseThrow(() -> new ResourceNotFoundException("Trainer application not found"));
    }

    private TrainerProfile profileForTrainer(Long trainerId) {
        return trainerProfileRepository.findByUserId(trainerId)
                .orElseThrow(() -> new ResourceNotFoundException("Trainer application not found"));
    }
}
