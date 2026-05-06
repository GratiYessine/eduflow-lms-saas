package com.example.lms.auth.service;

import com.example.lms.auth.entity.PasswordResetToken;
import com.example.lms.auth.repository.PasswordResetTokenRepository;
import com.example.lms.audit.service.AuditService;
import com.example.lms.common.util.SecureTokenService;
import com.example.lms.notifications.service.EmailService;
import com.example.lms.notifications.service.NotificationService;
import com.example.lms.users.entity.Role;
import com.example.lms.users.entity.User;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PasswordCodeServiceTest {

    @Mock PasswordResetTokenRepository passwordResetTokenRepository;
    @Mock SecureTokenService secureTokenService;
    @Mock NotificationService notificationService;
    @Mock EmailService emailService;
    @Mock AuditService auditService;

    @Test
    void sendsResetCodeByEmailAndStoresOnlyHash() {
        User user = user();
        when(secureTokenService.numericCode(6)).thenReturn("123456");
        when(secureTokenService.hash("44:PASSWORD_RESET:123456")).thenReturn("hashed-code");
        PasswordCodeService service = service();

        service.sendResetCode(user);

        ArgumentCaptor<PasswordResetToken> captor = ArgumentCaptor.forClass(PasswordResetToken.class);
        verify(passwordResetTokenRepository).markOutstandingTokensUsed(eq(44L), any(Instant.class));
        verify(passwordResetTokenRepository).save(captor.capture());
        verify(emailService).sendPasswordReset("learner@example.test", "123456");
        assertThat(captor.getValue().getTokenHash()).isEqualTo("hashed-code");
        assertThat(captor.getValue().getTokenHash()).doesNotContain("123456");
    }

    @Test
    void consumesMatchingChangeCodeOnce() {
        User user = user();
        PasswordResetToken token = new PasswordResetToken();
        token.setUserId(44L);
        token.setTokenHash("hashed-change");
        token.setExpiresAt(Instant.now().plusSeconds(60));
        when(secureTokenService.hash("44:PASSWORD_CHANGE:654321")).thenReturn("hashed-change");
        when(passwordResetTokenRepository.findByTokenHash("hashed-change")).thenReturn(Optional.of(token));
        PasswordCodeService service = service();

        service.consumeChangeCode(user, "654321");

        assertThat(token.getUsedAt()).isNotNull();
    }

    private PasswordCodeService service() {
        return new PasswordCodeService(passwordResetTokenRepository, secureTokenService, notificationService, emailService, auditService);
    }

    private User user() {
        User user = new User();
        user.setId(44L);
        user.setFirstName("Learner");
        user.setLastName("One");
        user.setEmail("learner@example.test");
        user.setRole(Role.LEARNER);
        return user;
    }

}
