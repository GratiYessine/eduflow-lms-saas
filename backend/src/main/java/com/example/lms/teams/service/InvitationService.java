package com.example.lms.teams.service;

import com.example.lms.auth.dto.AuthResponse;
import com.example.lms.auth.mapper.AuthMapper;
import com.example.lms.auth.service.EmailVerificationService;
import com.example.lms.audit.entity.AuditAction;
import com.example.lms.audit.service.AuditService;
import com.example.lms.common.exception.UnauthorizedException;
import com.example.lms.common.util.SecureTokenService;
import com.example.lms.notifications.service.EmailService;
import com.example.lms.teams.dto.AcceptInvitationRequest;
import com.example.lms.teams.entity.InvitationToken;
import com.example.lms.teams.entity.Team;
import com.example.lms.teams.repository.InvitationTokenRepository;
import com.example.lms.users.entity.User;
import com.example.lms.users.entity.UserStatus;
import com.example.lms.users.mapper.UserMapper;
import com.example.lms.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class InvitationService {

    private final InvitationTokenRepository invitationTokenRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final SecureTokenService secureTokenService;
    private final EmailService emailService;
    private final EmailVerificationService emailVerificationService;
    private final UserMapper userMapper;
    private final AuthMapper authMapper;
    private final AuditService auditService;

    @Transactional
    public void sendInvitation(User user, Team team, Long invitedBy) {
        String rawToken = secureTokenService.randomToken();
        InvitationToken token = new InvitationToken();
        token.setUserId(user.getId());
        token.setTeamId(team.getId());
        token.setCompanyId(team.getCompanyId());
        token.setInvitedBy(invitedBy);
        token.setTokenHash(secureTokenService.hash(rawToken));
        token.setExpiresAt(Instant.now().plusSeconds(7 * 24 * 60 * 60));
        invitationTokenRepository.save(token);
        emailService.sendInvitation(user.getEmail(), team.getName(), rawToken);
        auditService.record(AuditAction.INVITATION_SENT, user.getId(), team.getCompanyId(), "Team", team.getId(), "SUCCESS", "Invitation email issued");
    }

    @Transactional
    public AuthResponse acceptInvitation(AcceptInvitationRequest request) {
        InvitationToken token = invitationTokenRepository.findByTokenHash(secureTokenService.hash(request.token()))
                .filter(InvitationToken::isActive)
                .orElseThrow(() -> new UnauthorizedException("Invitation token is invalid or expired"));
        User user = userRepository.findById(token.getUserId())
                .orElseThrow(() -> new UnauthorizedException("Invitation user is invalid"));
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setStatus(UserStatus.PENDING);
        user.setPasswordChangedAt(Instant.now());
        token.setAcceptedAt(Instant.now());
        emailVerificationService.sendVerificationToken(user);
        auditService.record(AuditAction.INVITATION_ACCEPTED, user.getId(), user.getCompanyId(), "Team", token.getTeamId(), "SUCCESS", "Invitation accepted");
        return authMapper.toAuthResponse(null, null, userMapper.toResponse(user));
    }
}
