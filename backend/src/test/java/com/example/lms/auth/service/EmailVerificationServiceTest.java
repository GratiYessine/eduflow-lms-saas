package com.example.lms.auth.service;

import com.example.lms.auth.repository.EmailVerificationTokenRepository;
import com.example.lms.audit.service.AuditService;
import com.example.lms.common.util.SecureTokenService;
import com.example.lms.notifications.service.EmailService;
import com.example.lms.users.entity.Role;
import com.example.lms.users.entity.User;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class EmailVerificationServiceTest {

    @Mock EmailVerificationTokenRepository emailVerificationTokenRepository;
    @Mock EmailService emailService;
    @Mock AuditService auditService;

    @Test
    void sendsVerificationForNonSuperAdminUsers() {
        EmailVerificationService service = service();
        User learner = user(Role.LEARNER);

        service.sendVerificationToken(learner);

        verify(emailVerificationTokenRepository).save(any());
        verify(emailService).sendEmailVerification(eq("learner@example.test"), any());
    }

    @Test
    void skipsVerificationForSuperAdminUsers() {
        EmailVerificationService service = service();
        User superAdmin = user(Role.SUPER_ADMIN);

        service.sendVerificationToken(superAdmin);

        verify(emailVerificationTokenRepository, never()).save(any());
        verify(emailService, never()).sendEmailVerification(any(), any());
    }

    private EmailVerificationService service() {
        return new EmailVerificationService(
                emailVerificationTokenRepository,
                new SecureTokenService(),
                emailService,
                auditService
        );
    }

    private User user(Role role) {
        User user = new User();
        user.setId(10L);
        user.setFirstName("Test");
        user.setLastName("User");
        user.setEmail(role == Role.SUPER_ADMIN ? "admin@example.test" : "learner@example.test");
        user.setRole(role);
        return user;
    }
}
