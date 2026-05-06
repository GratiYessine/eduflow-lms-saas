package com.example.lms.notifications.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class EmailService {

    private final ObjectProvider<JavaMailSender> mailSender;
    private final boolean enabled;
    private final String from;
    private final String frontendBaseUrl;
    private final EmailTemplateService emailTemplateService;

    public EmailService(
            ObjectProvider<JavaMailSender> mailSender,
            EmailTemplateService emailTemplateService,
            @Value("${app.mail.enabled:false}") boolean enabled,
            @Value("${app.mail.from:no-reply@lms.local}") String from,
            @Value("${app.frontend-base-url:http://localhost:4200}") String frontendBaseUrl
    ) {
        this.mailSender = mailSender;
        this.emailTemplateService = emailTemplateService;
        this.enabled = enabled;
        this.from = from;
        this.frontendBaseUrl = frontendBaseUrl;
    }

    public void sendPasswordReset(String email, String code) {
        send(email, "Your LMS password reset code", emailTemplateService.passwordResetCode(code));
    }

    public void sendPasswordChangeCode(String email, String code) {
        send(email, "Your LMS password change code", emailTemplateService.passwordChangeCode(code));
    }

    public void sendEmailVerification(String email, String token) {
        String link = frontendBaseUrl + "/auth/verify-email?token=" + token;
        send(email, "Verify your LMS email", emailTemplateService.emailVerification(link));
    }

    public void sendInvitation(String email, String teamName, String token) {
        String link = frontendBaseUrl + "/auth/accept-invitation?token=" + token;
        send(email, "You were invited to join " + teamName, emailTemplateService.invitation(teamName, link));
    }

    public void sendTrainerApplicationReceived(String email) {
        send(email, "Your trainer application was received", emailTemplateService.trainerApplicationReceived(frontendBaseUrl + "/auth/trainer-pending?status=PENDING"));
    }

    public void sendTrainerApplicationAdminNotice(String email, String trainerName, String trainerEmail) {
        send(email, "New trainer application", emailTemplateService.trainerApplicationAdminNotice(trainerName, trainerEmail, frontendBaseUrl + "/admin/trainers/pending"));
    }

    public void sendTrainerApproved(String email) {
        send(email, "Your trainer account has been approved", emailTemplateService.trainerApproved(frontendBaseUrl + "/auth/login"));
    }

    public void sendTrainerRejected(String email, String reason) {
        send(email, "Your trainer application was rejected", emailTemplateService.trainerRejected(reason, frontendBaseUrl + "/auth/trainer-pending?status=REJECTED"));
    }

    private void send(String to, String subject, String htmlBody) {
        if (!enabled) {
            log.info("email_delivery_disabled to={} subject={} html={}", to, subject, htmlBody);
            return;
        }
        JavaMailSender sender = mailSender.getIfAvailable();
        if (sender == null) {
            log.warn("email_delivery_skipped reason=no_mail_sender to={} subject={}", to, subject);
            return;
        }
        try {
            log.info("email_send_attempt to={} subject={} from={}", to, subject, from);
            MimeMessage message = sender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, "UTF-8");
            helper.setFrom(from);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            sender.send(message);
            log.info("email_sent to={} subject={}", to, subject);
        } catch (MessagingException | MailException ex) {
            log.error("email_delivery_failed to={} subject={}", to, subject, ex);
        }
    }
}
