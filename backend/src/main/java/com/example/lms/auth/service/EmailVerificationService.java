package com.example.lms.auth.service;

import com.example.lms.auth.entity.EmailVerificationToken;
import com.example.lms.auth.repository.EmailVerificationTokenRepository;
import com.example.lms.audit.entity.AuditAction;
import com.example.lms.audit.service.AuditService;
import com.example.lms.common.util.SecureTokenService;
import com.example.lms.notifications.service.EmailService;
import com.example.lms.users.entity.Role;
import com.example.lms.users.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class EmailVerificationService {

    private final EmailVerificationTokenRepository emailVerificationTokenRepository;
    private final SecureTokenService secureTokenService;
    private final EmailService emailService;
    private final AuditService auditService;

    @Transactional
    public void sendVerificationToken(User user) {
        if (user.getRole() == Role.SUPER_ADMIN) {
            return;
        }
        emailVerificationTokenRepository.markOutstandingTokensVerified(user.getId(), Instant.now());
        String rawToken = secureTokenService.randomToken();
        EmailVerificationToken token = new EmailVerificationToken();
        token.setUserId(user.getId());
        token.setTokenHash(secureTokenService.hash(rawToken));
        token.setExpiresAt(Instant.now().plusSeconds(24 * 60 * 60));
        emailVerificationTokenRepository.save(token);
        emailService.sendEmailVerification(user.getEmail(), rawToken);
        auditService.record(AuditAction.EMAIL_VERIFICATION_SENT, user.getId(), user.getCompanyId(), "User", user.getId(), "SUCCESS", "Email verification token issued");
    }
}
