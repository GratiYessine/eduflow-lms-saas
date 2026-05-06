package com.example.lms.auth.service;

import com.example.lms.auth.entity.PasswordResetToken;
import com.example.lms.auth.repository.PasswordResetTokenRepository;
import com.example.lms.audit.entity.AuditAction;
import com.example.lms.audit.service.AuditService;
import com.example.lms.common.exception.UnauthorizedException;
import com.example.lms.common.util.SecureTokenService;
import com.example.lms.notifications.entity.NotificationType;
import com.example.lms.notifications.service.EmailService;
import com.example.lms.notifications.service.NotificationService;
import com.example.lms.users.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class PasswordCodeService {

    private static final int CODE_DIGITS = 6;
    private static final long CODE_TTL_SECONDS = 10 * 60;
    private static final String RESET_PURPOSE = "PASSWORD_RESET";
    private static final String CHANGE_PURPOSE = "PASSWORD_CHANGE";

    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final SecureTokenService secureTokenService;
    private final NotificationService notificationService;
    private final EmailService emailService;
    private final AuditService auditService;

    @Transactional
    public void sendResetCode(User user) {
        String code = issueCode(user, RESET_PURPOSE);
        notificationService.notify(user.getId(), "Password reset", "A password reset code was sent to your email", NotificationType.PASSWORD_RESET);
        emailService.sendPasswordReset(user.getEmail(), code);
        auditService.record(AuditAction.PASSWORD_RESET_REQUESTED, user.getId(), user.getCompanyId(), "User", user.getId(), "SUCCESS", "Password reset code issued");
    }

    @Transactional
    public void sendChangeCode(User user) {
        String code = issueCode(user, CHANGE_PURPOSE);
        notificationService.notify(user.getId(), "Password change", "A password change code was sent to your email", NotificationType.PASSWORD_RESET);
        emailService.sendPasswordChangeCode(user.getEmail(), code);
        auditService.record(AuditAction.PASSWORD_CHANGE_CODE_SENT, user.getId(), user.getCompanyId(), "User", user.getId(), "SUCCESS", "Password change code issued");
    }

    @Transactional
    public void consumeResetCode(User user, String code) {
        consumeCode(user, RESET_PURPOSE, code);
    }

    @Transactional
    public void consumeChangeCode(User user, String code) {
        consumeCode(user, CHANGE_PURPOSE, code);
    }

    private String issueCode(User user, String purpose) {
        passwordResetTokenRepository.markOutstandingTokensUsed(user.getId(), Instant.now());
        String code = secureTokenService.numericCode(CODE_DIGITS);
        PasswordResetToken token = new PasswordResetToken();
        token.setUserId(user.getId());
        token.setTokenHash(codeHash(user.getId(), purpose, code));
        token.setExpiresAt(Instant.now().plusSeconds(CODE_TTL_SECONDS));
        passwordResetTokenRepository.save(token);
        return code;
    }

    private void consumeCode(User user, String purpose, String code) {
        PasswordResetToken token = passwordResetTokenRepository.findByTokenHash(codeHash(user.getId(), purpose, code))
                .filter(candidate -> candidate.getUserId().equals(user.getId()))
                .filter(PasswordResetToken::isActive)
                .orElseThrow(() -> new UnauthorizedException("Password code is invalid or expired"));
        token.setUsedAt(Instant.now());
    }

    private String codeHash(Long userId, String purpose, String code) {
        return secureTokenService.hash(userId + ":" + purpose + ":" + code);
    }
}
