package com.example.lms.users.service;

import com.example.lms.auth.service.EmailVerificationService;
import com.example.lms.auth.repository.RefreshTokenRepository;
import com.example.lms.auth.service.PasswordCodeService;
import com.example.lms.audit.entity.AuditAction;
import com.example.lms.audit.service.AuditService;
import com.example.lms.common.exception.BadRequestException;
import com.example.lms.common.exception.DuplicateResourceException;
import com.example.lms.common.exception.ResourceNotFoundException;
import com.example.lms.common.dto.PageResponse;
import com.example.lms.common.util.StringSanitizer;
import com.example.lms.security.SecurityUtils;
import com.example.lms.users.dto.ChangePasswordRequest;
import com.example.lms.users.dto.CreateUserRequest;
import com.example.lms.users.dto.UpdateProfileRequest;
import com.example.lms.users.dto.UserResponse;
import com.example.lms.users.entity.Role;
import com.example.lms.users.entity.TrainerProfile;
import com.example.lms.users.entity.TrainerVerificationStatus;
import com.example.lms.users.entity.User;
import com.example.lms.users.entity.UserStatus;
import com.example.lms.users.mapper.UserMapper;
import com.example.lms.users.repository.TrainerProfileRepository;
import com.example.lms.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final TrainerProfileRepository trainerProfileRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final StringSanitizer sanitizer;
    private final EmailVerificationService emailVerificationService;
    private final PasswordCodeService passwordCodeService;
    private final RefreshTokenRepository refreshTokenRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public User currentUserOrThrow() {
        Long userId = SecurityUtils.currentUserId();
        if (userId == null) {
            throw new BadRequestException("Authenticated user is required");
        }
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    @Transactional(readOnly = true)
    public UserResponse me() {
        return userMapper.toResponse(currentUserOrThrow());
    }

    @Transactional(readOnly = true)
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','COMPANY_ADMIN','TEAM_MANAGER')")
    public PageResponse<UserResponse> list(String query, Role role, Long companyIdFilter, Pageable pageable) {
        Role currentRole = SecurityUtils.currentRole();
        Long companyId = SecurityUtils.currentCompanyId();
        Specification<User> spec = (root, cq, cb) -> cb.conjunction();
        if (currentRole != Role.SUPER_ADMIN) {
            if (companyId == null) {
                throw new BadRequestException("Company context is required");
            }
            spec = spec.and((root, cq, cb) -> cb.equal(root.get("companyId"), companyId));
        } else if (companyIdFilter != null) {
            spec = spec.and((root, cq, cb) -> cb.equal(root.get("companyId"), companyIdFilter));
        }
        if (role != null) {
            spec = spec.and((root, cq, cb) -> cb.equal(root.get("role"), role));
        }
        String cleanedQuery = sanitizer.clean(query);
        if (cleanedQuery != null && !cleanedQuery.isBlank()) {
            String term = "%" + cleanedQuery.toLowerCase() + "%";
            spec = spec.and((root, cq, cb) -> cb.or(
                    cb.like(cb.lower(root.get("firstName")), term),
                    cb.like(cb.lower(root.get("lastName")), term),
                    cb.like(cb.lower(root.get("email")), term)
            ));
        }
        return PageResponse.from(userRepository.findAll(spec, pageable).map(userMapper::toResponse));
    }

    @Transactional
    public UserResponse updateMe(UpdateProfileRequest request) {
        User user = currentUserOrThrow();
        if (request.firstName() != null && !request.firstName().isBlank()) {
            user.setFirstName(request.firstName().trim());
        }
        if (request.lastName() != null && !request.lastName().isBlank()) {
            user.setLastName(request.lastName().trim());
        }
        user.setPhone(request.phone());
        user.setAvatarUrl(request.avatarUrl());
        return userMapper.toResponse(user);
    }

    @Transactional
    public void changePassword(ChangePasswordRequest request) {
        User user = currentUserOrThrow();
        if (!passwordEncoder.matches(request.currentPassword(), user.getPassword())) {
            throw new BadRequestException("Current password is invalid");
        }
        passwordCodeService.consumeChangeCode(user, request.code());
        user.setPassword(passwordEncoder.encode(request.newPassword()));
        user.setPasswordChangedAt(Instant.now());
        user.setTokenVersion(user.getTokenVersion() + 1);
        refreshTokenRepository.revokeActiveTokensForUser(user.getId(), Instant.now());
        auditService.record(AuditAction.PASSWORD_CHANGED, user.getId(), user.getCompanyId(), "User", user.getId(), "SUCCESS", "Password changed with email code");
    }

    @Transactional
    public void sendChangePasswordCode() {
        passwordCodeService.sendChangeCode(currentUserOrThrow());
    }

    @Transactional
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','COMPANY_ADMIN')")
    public UserResponse create(CreateUserRequest request) {
        Role creatorRole = SecurityUtils.currentRole();
        Long creatorCompanyId = SecurityUtils.currentCompanyId();
        Role requestedRole = request.role();
        if (creatorRole == Role.COMPANY_ADMIN && requestedRole != Role.LEARNER && requestedRole != Role.TEAM_MANAGER) {
            throw new BadRequestException("Company admins can only create learners or team managers");
        }
        Long companyId = creatorRole == Role.SUPER_ADMIN ? request.companyId() : creatorCompanyId;
        if (requestedRole != Role.SUPER_ADMIN && requestedRole != Role.TRAINER && companyId == null) {
            throw new BadRequestException("companyId is required for company-scoped users");
        }
        if ((requestedRole == Role.LEARNER || requestedRole == Role.TEAM_MANAGER || requestedRole == Role.COMPANY_ADMIN) && companyId == null) {
            throw new BadRequestException("companyId is required for this role");
        }
        String email = sanitizer.email(request.email());
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new DuplicateResourceException("Email is already used");
        }
        User user = new User();
        user.setFirstName(sanitizer.clean(request.firstName()));
        user.setLastName(sanitizer.clean(request.lastName()));
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setRole(requestedRole);
        user.setCompanyId(requestedRole == Role.SUPER_ADMIN ? null : companyId);
        user.setPhone(sanitizer.clean(request.phone()));
        user.setStatus(requestedRole == Role.SUPER_ADMIN ? UserStatus.ACTIVE : UserStatus.PENDING);
        User saved = userRepository.save(user);
        if (requestedRole == Role.TRAINER) {
            TrainerProfile profile = new TrainerProfile();
            profile.setUserId(saved.getId());
            profile.setVerificationStatus(TrainerVerificationStatus.APPROVED);
            profile.setApprovedAt(java.time.Instant.now());
            profile.setApprovedBy(SecurityUtils.currentUserId());
            trainerProfileRepository.save(profile);
        }
        emailVerificationService.sendVerificationToken(saved);
        return userMapper.toResponse(saved);
    }

    @Transactional(readOnly = true)
    @PreAuthorize("hasRole('SUPER_ADMIN') or @tenantSecurity.hasCompanyAccess(#companyId)")
    public User getCompanyUser(Long companyId, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (!companyId.equals(user.getCompanyId())) {
            throw new ResourceNotFoundException("User not found in company");
        }
        return user;
    }
}
