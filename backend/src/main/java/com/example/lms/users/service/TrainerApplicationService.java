package com.example.lms.users.service;

import com.example.lms.auth.dto.RegisterTrainerRequest;
import com.example.lms.auth.service.EmailVerificationService;
import com.example.lms.common.exception.BadRequestException;
import com.example.lms.common.exception.DuplicateResourceException;
import com.example.lms.common.exception.ResourceNotFoundException;
import com.example.lms.common.util.StringSanitizer;
import com.example.lms.files.dto.FileResponse;
import com.example.lms.files.entity.FileCategory;
import com.example.lms.files.repository.StoredFileRepository;
import com.example.lms.files.service.FileStorageService;
import com.example.lms.notifications.entity.NotificationType;
import com.example.lms.notifications.service.EmailService;
import com.example.lms.notifications.service.NotificationService;
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
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TrainerApplicationService {

    private static final long MAX_DOCUMENT_BYTES = 10L * 1024 * 1024;

    private final UserRepository userRepository;
    private final TrainerProfileRepository trainerProfileRepository;
    private final StoredFileRepository storedFileRepository;
    private final FileStorageService fileStorageService;
    private final PasswordEncoder passwordEncoder;
    private final StringSanitizer sanitizer;
    private final NotificationService notificationService;
    private final EmailService emailService;
    private final EmailVerificationService emailVerificationService;
    private final TrainerApplicationMapper trainerApplicationMapper;

    @Transactional
    public TrainerApplicationResponse register(RegisterTrainerRequest request) {
        validateApplication(request);
        String normalizedEmail = sanitizer.email(request.getEmail());
        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new DuplicateResourceException("Email is already used");
        }

        User user = new User();
        user.setFirstName(sanitizer.clean(request.getFirstName()));
        user.setLastName(sanitizer.clean(request.getLastName()));
        user.setEmail(normalizedEmail);
        user.setPhone(sanitizer.clean(request.getPhone()));
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(Role.TRAINER);
        user.setStatus(UserStatus.PENDING);
        user = userRepository.save(user);

        TrainerProfile profile = new TrainerProfile();
        profile.setUserId(user.getId());
        profile.setVerificationStatus(TrainerVerificationStatus.PENDING);
        profile.setExpertise(sanitizer.clean(request.getSpecialty()));
        profile.setBio(sanitizer.clean(request.getBio()));
        profile.setPortfolioUrl(sanitizer.clean(request.getPortfolioUrl()));
        profile.setSocialLinks(sanitizer.clean(request.getSocialLinks()));
        profile.setMotivation(sanitizer.clean(request.getMotivation()));
        profile.setCvUrl(storeDocument(request.getCv(), user.getId()));
        profile.setCertificateUrl(storeOptionalDocument(request.getCertificate(), user.getId()));
        profile.setDiplomaUrl(storeOptionalDocument(request.getDiploma(), user.getId()));
        profile = trainerProfileRepository.save(profile);

        emailVerificationService.sendVerificationToken(user);
        notifyAdmins(user);
        emailService.sendTrainerApplicationReceived(user.getEmail());
        return trainerApplicationMapper.toResponse(user, profile);
    }

    @Transactional(readOnly = true)
    public List<TrainerApplicationResponse> pending() {
        return listApplications(TrainerVerificationStatus.PENDING);
    }

    @Transactional(readOnly = true)
    public List<TrainerApplicationResponse> listApplications(TrainerVerificationStatus status) {
        List<TrainerProfile> profiles = status == null
                ? trainerProfileRepository.findAllByOrderByCreatedAtDesc()
                : trainerProfileRepository.findByVerificationStatusOrderByCreatedAtDesc(status);
        return profiles
                .stream()
                .map(profile -> trainerApplicationMapper.toResponse(userForProfile(profile), profile))
                .toList();
    }

    @Transactional(readOnly = true)
    public TrainerApplicationResponse getApplication(Long trainerId) {
        TrainerProfile profile = profileForTrainer(trainerId);
        return trainerApplicationMapper.toResponse(userForProfile(profile), profile);
    }

    private TrainerProfile profileForTrainer(Long trainerId) {
        return trainerProfileRepository.findByUserId(trainerId)
                .orElseThrow(() -> new ResourceNotFoundException("Trainer application not found"));
    }

    private void validateApplication(RegisterTrainerRequest request) {
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new BadRequestException("Password confirmation does not match");
        }
        validatePortfolioUrl(request.getPortfolioUrl());
        validateRequiredPdf(request.getCv(), "CV");
        validateOptionalPdf(request.getCertificate(), "Certificate");
        validateOptionalPdf(request.getDiploma(), "Diploma");
    }

    private void validatePortfolioUrl(String value) {
        if (value == null || value.isBlank()) {
            return;
        }
        if (!value.startsWith("http://") && !value.startsWith("https://")) {
            throw new BadRequestException("Portfolio URL must start with http:// or https://");
        }
    }

    private void validateRequiredPdf(MultipartFile file, String label) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException(label + " file is required");
        }
        validatePdf(file, label);
    }

    private void validateOptionalPdf(MultipartFile file, String label) {
        if (file == null || file.isEmpty()) {
            return;
        }
        validatePdf(file, label);
    }

    private void validatePdf(MultipartFile file, String label) {
        if (file.getSize() > MAX_DOCUMENT_BYTES) {
            throw new BadRequestException(label + " file must be 10MB or smaller");
        }
        String filename = file.getOriginalFilename() == null ? "" : file.getOriginalFilename().toLowerCase();
        String contentType = file.getContentType() == null ? "" : file.getContentType().toLowerCase();
        if (!filename.endsWith(".pdf") || !"application/pdf".equals(contentType)) {
            throw new BadRequestException(label + " must be a PDF file");
        }
    }

    private String storeDocument(MultipartFile file, Long userId) {
        FileResponse response = fileStorageService.store(file, FileCategory.OTHER);
        storedFileRepository.findById(response.id()).ifPresent(stored -> stored.setUploadedBy(userId));
        return response.url();
    }

    private String storeOptionalDocument(MultipartFile file, Long userId) {
        if (file == null || file.isEmpty()) {
            return null;
        }
        return storeDocument(file, userId);
    }

    private void notifyAdmins(User trainer) {
        String trainerName = trainer.getFirstName() + " " + trainer.getLastName();
        userRepository.findByRole(Role.SUPER_ADMIN).forEach(admin -> {
            notificationService.notify(admin.getId(), "Trainer application received", trainerName + " is waiting for verification.", NotificationType.TRAINER_APPLICATION);
            emailService.sendTrainerApplicationAdminNotice(admin.getEmail(), trainerName, trainer.getEmail());
        });
    }

    private User userForProfile(TrainerProfile profile) {
        return userRepository.findById(profile.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Trainer user not found"));
    }
}
