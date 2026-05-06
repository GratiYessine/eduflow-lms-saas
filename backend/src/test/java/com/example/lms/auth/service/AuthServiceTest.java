package com.example.lms.auth.service;

import com.example.lms.auth.dto.AuthResponse;
import com.example.lms.auth.dto.ForgotPasswordRequest;
import com.example.lms.auth.dto.RegisterRequest;
import com.example.lms.auth.mapper.AuthMapper;
import com.example.lms.auth.repository.EmailVerificationTokenRepository;
import com.example.lms.auth.repository.PasswordResetTokenRepository;
import com.example.lms.auth.repository.RefreshTokenRepository;
import com.example.lms.audit.service.AuditService;
import com.example.lms.common.util.SecureTokenService;
import com.example.lms.common.util.StringSanitizer;
import com.example.lms.companies.entity.Company;
import com.example.lms.companies.repository.CompanyRepository;
import com.example.lms.notifications.service.EmailService;
import com.example.lms.notifications.service.NotificationService;
import com.example.lms.security.JwtService;
import com.example.lms.users.dto.UserResponse;
import com.example.lms.users.entity.Role;
import com.example.lms.users.entity.User;
import com.example.lms.users.entity.UserStatus;
import com.example.lms.users.mapper.UserMapper;
import com.example.lms.users.repository.TrainerProfileRepository;
import com.example.lms.users.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock UserRepository userRepository;
    @Mock CompanyRepository companyRepository;
    @Mock RefreshTokenRepository refreshTokenRepository;
    @Mock PasswordResetTokenRepository passwordResetTokenRepository;
    @Mock EmailVerificationTokenRepository emailVerificationTokenRepository;
    @Mock PasswordEncoder passwordEncoder;
    @Mock AuthenticationManager authenticationManager;
    @Mock JwtService jwtService;
    @Mock UserMapper userMapper;
    @Mock TrainerProfileRepository trainerProfileRepository;
    @Mock NotificationService notificationService;
    @Mock EmailService emailService;
    @Mock AuditService auditService;
    EmailVerificationService emailVerificationService;
    PasswordCodeService passwordCodeService;
    AuthService authService;

    @BeforeEach
    void setUp() {
        emailVerificationService = new EmailVerificationService(
                emailVerificationTokenRepository,
                new SecureTokenService(),
                emailService,
                auditService
        );
        passwordCodeService = new PasswordCodeService(
                passwordResetTokenRepository,
                new SecureTokenService(),
                notificationService,
                emailService,
                auditService
        );
        authService = new AuthService(
                userRepository,
                companyRepository,
                refreshTokenRepository,
                emailVerificationTokenRepository,
                passwordEncoder,
                authenticationManager,
                jwtService,
                userMapper,
                new AuthMapper() {
                },
                emailVerificationService,
                passwordCodeService,
                new SecureTokenService(),
                new StringSanitizer(),
                auditService,
                trainerProfileRepository
        );
    }

    @Test
    void registerCreatesPendingCompanyAdminAndSendsVerification() {
        ReflectionTestUtils.setField(authService, "refreshExpirationMillis", 604800000L);
        RegisterRequest request = new RegisterRequest("Ada", "Lovelace", "ada@acme.test", "Password1", "Acme", "Tech", "https://acme.test", "50");
        when(userRepository.existsByEmailIgnoreCase(request.email())).thenReturn(false);
        when(companyRepository.existsByNameIgnoreCase(request.companyName())).thenReturn(false);
        when(passwordEncoder.encode(request.password())).thenReturn("encoded");
        when(companyRepository.save(any(Company.class))).thenAnswer(invocation -> {
            Company company = invocation.getArgument(0);
            company.setId(10L);
            return company;
        });
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            user.setId(20L);
            return user;
        });
        when(userMapper.toResponse(any(User.class))).thenReturn(new UserResponse(20L, "Ada", "Lovelace", "ada@acme.test", null, null, Role.COMPANY_ADMIN, UserStatus.PENDING, 10L, Instant.now(), Instant.now()));

        AuthResponse response = authService.register(request);

        assertThat(response.accessToken()).isNull();
        assertThat(response.refreshToken()).isNull();
        assertThat(response.user().companyId()).isEqualTo(10L);
        assertThat(response.user().status()).isEqualTo(UserStatus.PENDING);
        verify(emailVerificationTokenRepository).save(any());
        verify(emailService).sendEmailVerification(eq("ada@acme.test"), any());
    }

    @Test
    void loginLocksAccountAfterRepeatedFailures() {
        User user = new User();
        user.setId(33L);
        user.setEmail("locked@example.test");
        user.setPassword("encoded");
        user.setFirstName("Lock");
        user.setLastName("Me");
        user.setRole(Role.LEARNER);
        user.setStatus(UserStatus.ACTIVE);
        when(userRepository.findByEmailIgnoreCase("locked@example.test")).thenReturn(Optional.of(user));
        when(authenticationManager.authenticate(any())).thenThrow(new BadCredentialsException("bad"));

        for (int i = 0; i < 5; i++) {
            assertThatThrownBy(() -> authService.login(new com.example.lms.auth.dto.LoginRequest("LOCKED@example.test", "wrong")))
                    .hasMessageContaining("Invalid email or password");
        }

        assertThat(user.getFailedLoginAttempts()).isEqualTo(5);
        assertThat(user.getLockedUntil()).isAfter(Instant.now());
        verify(authenticationManager, times(5)).authenticate(any());
    }

    @Test
    void forgotPasswordInvalidatesPreviousResetTokens() {
        User user = new User();
        user.setId(44L);
        user.setEmail("reset@example.test");
        user.setFirstName("Reset");
        user.setLastName("User");
        user.setRole(Role.LEARNER);
        user.setStatus(UserStatus.ACTIVE);
        when(userRepository.findByEmailIgnoreCase("reset@example.test")).thenReturn(Optional.of(user));

        authService.forgotPassword(new ForgotPasswordRequest("reset@example.test"));

        verify(passwordResetTokenRepository).markOutstandingTokensUsed(eq(44L), any());
        verify(passwordResetTokenRepository).save(any());
        verify(emailService).sendPasswordReset(any(), any());
    }
}
