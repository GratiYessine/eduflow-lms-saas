package com.example.lms.auth.service;

import com.example.lms.auth.dto.AuthResponse;
import com.example.lms.auth.dto.ForgotPasswordRequest;
import com.example.lms.auth.dto.LoginRequest;
import com.example.lms.auth.dto.RefreshTokenRequest;
import com.example.lms.auth.dto.RegisterRequest;
import com.example.lms.auth.dto.ResetPasswordRequest;
import com.example.lms.auth.dto.VerifyEmailRequest;
import com.example.lms.auth.entity.EmailVerificationToken;
import com.example.lms.auth.entity.RefreshToken;
import com.example.lms.auth.mapper.AuthMapper;
import com.example.lms.auth.repository.EmailVerificationTokenRepository;
import com.example.lms.auth.repository.RefreshTokenRepository;
import com.example.lms.audit.entity.AuditAction;
import com.example.lms.audit.service.AuditService;
import com.example.lms.common.exception.DuplicateResourceException;
import com.example.lms.common.exception.UnauthorizedException;
import com.example.lms.common.util.SecureTokenService;
import com.example.lms.common.util.StringSanitizer;
import com.example.lms.companies.entity.Company;
import com.example.lms.companies.repository.CompanyRepository;
import com.example.lms.security.JwtService;
import com.example.lms.security.SecurityUtils;
import com.example.lms.users.entity.Role;
import com.example.lms.users.entity.TrainerProfile;
import com.example.lms.users.entity.TrainerVerificationStatus;
import com.example.lms.users.entity.User;
import com.example.lms.users.entity.UserStatus;
import com.example.lms.users.mapper.UserMapper;
import com.example.lms.users.repository.TrainerProfileRepository;
import com.example.lms.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final CompanyRepository companyRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final EmailVerificationTokenRepository emailVerificationTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final UserMapper userMapper;
    private final AuthMapper authMapper;
    private final EmailVerificationService emailVerificationService;
    private final PasswordCodeService passwordCodeService;
    private final SecureTokenService secureTokenService;
    private final StringSanitizer sanitizer;
    private final AuditService auditService;
    private final TrainerProfileRepository trainerProfileRepository;

    private static final int MAX_FAILED_LOGIN_ATTEMPTS = 5;
    private static final long LOCK_DURATION_SECONDS = 15 * 60;

    @Value("${app.jwt.refresh-expiration-ms}")
    private long refreshExpirationMillis;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String normalizedEmail = sanitizer.email(request.email());
        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new DuplicateResourceException("Email is already used");
        }
        if (companyRepository.existsByNameIgnoreCase(request.companyName())) {
            throw new DuplicateResourceException("Company name is already used");
        }

        Company company = new Company();
        company.setName(sanitizer.clean(request.companyName()));
        company.setIndustry(sanitizer.clean(request.industry()));
        company.setWebsite(sanitizer.clean(request.website()));
        company.setSize(sanitizer.clean(request.companySize()));
        company = companyRepository.save(company);

        User user = new User();
        user.setFirstName(sanitizer.clean(request.firstName()));
        user.setLastName(sanitizer.clean(request.lastName()));
        user.setEmail(normalizedEmail);
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setRole(Role.COMPANY_ADMIN);
        user.setStatus(UserStatus.PENDING);
        user.setCompanyId(company.getId());
        user = userRepository.save(user);

        emailVerificationService.sendVerificationToken(user);
        auditService.record(AuditAction.USER_REGISTERED, user.getId(), company.getId(), "User", user.getId(), "SUCCESS", "Company admin registered pending email verification");
        log.info("User registered pending email verification email={} companyId={}", user.getEmail(), company.getId());
        return authMapper.toAuthResponse(null, null, userMapper.toResponse(user));
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        String normalizedEmail = sanitizer.email(request.email());
        User user = userRepository.findByEmailIgnoreCase(normalizedEmail)
                .orElse(null);
        if (user != null && user.isLoginLocked()) {
            log.warn("Login blocked for locked account email={} lockedUntil={}", normalizedEmail, user.getLockedUntil());
            throw new UnauthorizedException("Account is temporarily locked. Please try again later.");
        }
        String blockMessage = user == null ? null : accountAccessBlockMessage(user);
        if (blockMessage != null) {
            throw new UnauthorizedException(blockMessage);
        }
        try {
            authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(normalizedEmail, request.password()));
            User authenticated = userRepository.findByEmailIgnoreCase(normalizedEmail)
                    .orElseThrow(() -> new UnauthorizedException("Invalid email or password"));
            blockMessage = accountAccessBlockMessage(authenticated);
            if (blockMessage != null) {
                throw new UnauthorizedException(blockMessage);
            }
            authenticated.setFailedLoginAttempts(0);
            authenticated.setLockedUntil(null);
            authenticated.setLastLoginAt(Instant.now());
            auditService.record(AuditAction.LOGIN_SUCCESS, authenticated.getId(), authenticated.getCompanyId(), "User", authenticated.getId(), "SUCCESS", "Login completed");
            log.info("Login success for {}", authenticated.getEmail());
            return issueTokens(authenticated);
        } catch (BadCredentialsException | LockedException | DisabledException ex) {
            registerFailedLogin(user, normalizedEmail);
            throw new UnauthorizedException("Invalid email or password");
        }
    }

    @Transactional
    public AuthResponse refresh(RefreshTokenRequest request) {
        RefreshToken token = refreshTokenRepository.findByTokenHash(secureTokenService.hash(request.refreshToken()))
                .orElseThrow(() -> new UnauthorizedException("Refresh token is invalid or expired"));
        if (!token.isActive()) {
            refreshTokenRepository.revokeActiveTokensForUser(token.getUserId(), Instant.now());
            log.warn("Refresh token reuse or expired-token attempt detected userId={}", token.getUserId());
            throw new UnauthorizedException("Refresh token is invalid or expired");
        }
        token.setRevokedAt(Instant.now());
        User user = userRepository.findById(token.getUserId())
                .orElseThrow(() -> new UnauthorizedException("Refresh token user is invalid"));
        String blockMessage = accountAccessBlockMessage(user);
        if (blockMessage != null) {
            token.setRevokedAt(Instant.now());
            refreshTokenRepository.revokeActiveTokensForUser(user.getId(), Instant.now());
            throw new UnauthorizedException(blockMessage);
        }
        return issueTokens(user);
    }

    @Transactional
    public void logout(RefreshTokenRequest request) {
        refreshTokenRepository.findByTokenHash(secureTokenService.hash(request.refreshToken()))
                .ifPresent(token -> token.setRevokedAt(Instant.now()));
        Long currentUserId = SecurityUtils.currentUserId();
        if (currentUserId != null) {
            userRepository.findById(currentUserId)
                    .ifPresent(user -> user.setTokenVersion(user.getTokenVersion() + 1));
            refreshTokenRepository.revokeActiveTokensForUser(currentUserId, Instant.now());
        }
    }

    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        userRepository.findByEmailIgnoreCase(sanitizer.email(request.email()))
                .ifPresent(passwordCodeService::sendResetCode);
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        User user = userRepository.findByEmailIgnoreCase(sanitizer.email(request.email()))
                .orElseThrow(() -> new UnauthorizedException("Password code is invalid or expired"));
        passwordCodeService.consumeResetCode(user, request.code());
        user.setPassword(passwordEncoder.encode(request.newPassword()));
        if (user.getStatus() == UserStatus.PENDING) {
            user.setStatus(UserStatus.ACTIVE);
        }
        user.setFailedLoginAttempts(0);
        user.setLockedUntil(null);
        user.setPasswordChangedAt(Instant.now());
        refreshTokenRepository.revokeActiveTokensForUser(user.getId(), Instant.now());
        auditService.record(AuditAction.PASSWORD_RESET_COMPLETED, user.getId(), user.getCompanyId(), "User", user.getId(), "SUCCESS", "Password reset completed");
    }

    @Transactional
    public AuthResponse verifyEmail(VerifyEmailRequest request) {
        EmailVerificationToken token = emailVerificationTokenRepository.findByTokenHash(secureTokenService.hash(request.token()))
                .filter(EmailVerificationToken::isActive)
                .orElseThrow(() -> new UnauthorizedException("Email verification token is invalid or expired"));
        User user = userRepository.findById(token.getUserId())
                .orElseThrow(() -> new UnauthorizedException("Email verification user is invalid"));
        user.setStatus(UserStatus.ACTIVE);
        token.setVerifiedAt(Instant.now());
        auditService.record(AuditAction.EMAIL_VERIFIED, user.getId(), user.getCompanyId(), "User", user.getId(), "SUCCESS", "Email verified");
        if (accountAccessBlockMessage(user) != null) {
            return authMapper.toAuthResponse(null, null, userMapper.toResponse(user));
        }
        return issueTokens(user);
    }

    @Transactional
    public void resendVerification(ForgotPasswordRequest request) {
        userRepository.findByEmailIgnoreCase(sanitizer.email(request.email()))
                .filter(user -> user.getStatus() == UserStatus.PENDING)
                .ifPresent(emailVerificationService::sendVerificationToken);
    }

    private AuthResponse issueTokens(User user) {
        String blockMessage = accountAccessBlockMessage(user);
        if (blockMessage != null) {
            throw new UnauthorizedException(blockMessage);
        }
        String accessToken = jwtService.generateAccessToken(user);
        String rawRefreshToken = secureTokenService.randomToken();
        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setUserId(user.getId());
        refreshToken.setTokenHash(secureTokenService.hash(rawRefreshToken));
        refreshToken.setExpiresAt(Instant.now().plusMillis(refreshExpirationMillis));
        refreshTokenRepository.save(refreshToken);
        return authMapper.toAuthResponse(accessToken, rawRefreshToken, userMapper.toResponse(user));
    }

    private void registerFailedLogin(User user, String email) {
        log.warn("Login failure for {}", email);
        if (user == null) {
            auditService.record(AuditAction.LOGIN_FAILURE, null, null, "User", null, "FAILURE", "Login failed for unknown email");
            return;
        }
        int attempts = user.getFailedLoginAttempts() + 1;
        user.setFailedLoginAttempts(attempts);
        if (attempts >= MAX_FAILED_LOGIN_ATTEMPTS) {
            user.setLockedUntil(Instant.now().plusSeconds(LOCK_DURATION_SECONDS));
            auditService.record(AuditAction.ACCOUNT_LOCKED, user.getId(), user.getCompanyId(), "User", user.getId(), "FAILURE", "Account locked after failed login attempts");
            log.warn("Account locked after failed logins userId={} email={}", user.getId(), user.getEmail());
        }
        auditService.record(AuditAction.LOGIN_FAILURE, user.getId(), user.getCompanyId(), "User", user.getId(), "FAILURE", "Invalid login credentials");
    }

    private String inactiveAccountMessage(User user) {
        if (user.getStatus() == UserStatus.PENDING) {
            return "Account is pending email verification";
        }
        if (user.getRole() == Role.TRAINER) {
            return trainerProfileRepository.findByUserId(user.getId())
                    .map(this::trainerAccessMessage)
                    .orElse("Trainer account is not active");
        }
        return "Account is not active";
    }

    private String accountAccessBlockMessage(User user) {
        if (!user.isActive()) {
            return inactiveAccountMessage(user);
        }
        if (user.getRole() != Role.TRAINER) {
            return null;
        }
        TrainerProfile profile = trainerProfileRepository.findByUserId(user.getId())
                .orElse(null);
        if (profile == null) {
            return "Trainer account is not verified";
        }
        return profile.getVerificationStatus() == TrainerVerificationStatus.APPROVED ? null : trainerAccessMessage(profile);
    }

    private String trainerAccessMessage(TrainerProfile profile) {
        if (profile.getVerificationStatus() == TrainerVerificationStatus.PENDING) {
            return "Your trainer application is still under review.";
        }
        if (profile.getVerificationStatus() == TrainerVerificationStatus.REJECTED) {
            String reason = profile.getRejectionReason();
            return reason == null || reason.isBlank()
                    ? "Your trainer application was rejected."
                    : "Your trainer application was rejected. " + reason;
        }
        return "Trainer account is not active";
    }
}
