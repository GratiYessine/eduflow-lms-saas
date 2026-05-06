package com.example.lms.notifications.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class EmailTemplateService {

    private final String appName;
    private final String primaryColor;
    private final String logoUrl;

    public EmailTemplateService(
            @Value("${app.mail.brand.name:EduFlow B2B LMS}") String appName,
            @Value("${app.mail.brand.primary-color:#2563eb}") String primaryColor,
            @Value("${app.mail.brand.logo-url:}") String logoUrl
    ) {
        this.appName = appName;
        this.primaryColor = primaryColor;
        this.logoUrl = logoUrl;
    }

    public String passwordResetCode(String code) {
        return codeLayout("Reset your password",
                "We received a request to reset your password. Use this verification code to choose a new password.",
                code);
    }

    public String passwordChangeCode(String code) {
        return codeLayout("Confirm password change",
                "Use this verification code to confirm the password change for your account.",
                code);
    }

    public String emailVerification(String link) {
        return layout("Verify your email",
                "Welcome to " + escape(appName) + ". Verify your email address to activate your account.",
                "Verify email",
                link);
    }

    public String invitation(String teamName, String link) {
        return layout("You have been invited",
                "You were invited to join the team <strong>" + escape(teamName) + "</strong>. Accept the invitation and set your password.",
                "Accept invitation",
                link);
    }

    public String trainerApplicationReceived(String statusLink) {
        return layout("Trainer application received",
                "Thanks for applying to become a trainer on " + escape(appName) + ". Your profile is now in review. A super admin will check your portfolio, CV, and documents before activating your trainer workspace.",
                "View application status",
                statusLink);
    }

    public String trainerApplicationAdminNotice(String trainerName, String email, String reviewLink) {
        return layout("New trainer application",
                "<strong>" + escape(trainerName) + "</strong> submitted a trainer application with email <strong>" + escape(email) + "</strong>. Review the CV, portfolio, and motivation before approving dashboard access.",
                "Review applications",
                reviewLink);
    }

    public String trainerApproved(String loginLink) {
        return layout("Your trainer account has been approved",
                "Your trainer account has been approved. You can now log in and access your trainer dashboard.",
                "Login",
                loginLink);
    }

    public String trainerRejected(String reason) {
        String body = "Your trainer application was rejected.";
        if (reason != null && !reason.isBlank()) {
            body += " Reason: " + escape(reason);
        }
        body += " You can contact the EduFlow team if you believe this decision needs another review.";
        return layout("Trainer application rejected", body, "View status", "#");
    }

    public String trainerRejected(String reason, String statusLink) {
        String body = "Your trainer application was rejected.";
        if (reason != null && !reason.isBlank()) {
            body += " Reason: " + escape(reason);
        }
        body += " You can contact the EduFlow team if you believe this decision needs another review.";
        return layout("Trainer application rejected", body, "View status", statusLink);
    }

    private String layout(String title, String body, String buttonText, String link) {
        String logo = logoUrl == null || logoUrl.isBlank()
                ? "<div style=\"font-size:22px;font-weight:700;color:" + primaryColor + ";\">" + escape(appName) + "</div>"
                : "<img src=\"" + escape(logoUrl) + "\" alt=\"" + escape(appName) + "\" style=\"max-height:42px;\">";
        return """
                <!doctype html>
                <html>
                <body style="margin:0;background:#f6f8fb;font-family:Arial,Helvetica,sans-serif;color:#172033;">
                  <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="background:#f6f8fb;padding:32px 12px;">
                    <tr>
                      <td align="center">
                        <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border:1px solid #e6eaf0;border-radius:16px;overflow:hidden;box-shadow:0 18px 45px rgba(15,23,42,.08);">
                          <tr>
                            <td style="padding:26px 32px;border-bottom:1px solid #e6eaf0;background:linear-gradient(135deg,#eef2ff,#ecfeff);">%s</td>
                          </tr>
                          <tr>
                            <td style="padding:32px;">
                              <h1 style="margin:0 0 16px;font-size:24px;line-height:1.3;color:#101828;">%s</h1>
                              <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#475467;">%s</p>
                              <a href="%s" style="display:inline-block;background:%s;color:#ffffff;text-decoration:none;padding:13px 20px;border-radius:10px;font-weight:700;">%s</a>
                              <p style="margin:24px 0 0;font-size:12px;line-height:1.5;color:#667085;">If the button does not work, copy and paste this URL into your browser:<br>%s</p>
                              <p style="margin:22px 0 0;font-size:12px;line-height:1.5;color:#98a2b3;">This is an automated EduFlow onboarding message.</p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </body>
                </html>
                """.formatted(logo, escape(title), body, escape(link), primaryColor, escape(buttonText), escape(link));
    }

    private String codeLayout(String title, String body, String code) {
        String logo = logoUrl == null || logoUrl.isBlank()
                ? "<div style=\"font-size:22px;font-weight:700;color:" + primaryColor + ";\">" + escape(appName) + "</div>"
                : "<img src=\"" + escape(logoUrl) + "\" alt=\"" + escape(appName) + "\" style=\"max-height:42px;\">";
        return """
                <!doctype html>
                <html>
                <body style="margin:0;background:#f6f8fb;font-family:Arial,Helvetica,sans-serif;color:#172033;">
                  <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="background:#f6f8fb;padding:32px 12px;">
                    <tr>
                      <td align="center">
                        <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border:1px solid #e6eaf0;border-radius:16px;overflow:hidden;box-shadow:0 18px 45px rgba(15,23,42,.08);">
                          <tr>
                            <td style="padding:26px 32px;border-bottom:1px solid #e6eaf0;background:linear-gradient(135deg,#eef2ff,#ecfeff);">%s</td>
                          </tr>
                          <tr>
                            <td style="padding:32px;">
                              <h1 style="margin:0 0 16px;font-size:24px;line-height:1.3;color:#101828;">%s</h1>
                              <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#475467;">%s</p>
                              <div style="display:inline-block;letter-spacing:8px;font-size:34px;font-weight:800;color:#101828;background:#eef2ff;border:1px solid #c7d2fe;border-radius:14px;padding:16px 20px;">%s</div>
                              <p style="margin:24px 0 0;font-size:13px;line-height:1.5;color:#667085;">This code expires in 10 minutes. If you did not request it, you can safely ignore this email.</p>
                              <p style="margin:22px 0 0;font-size:12px;line-height:1.5;color:#98a2b3;">This is an automated EduFlow security message.</p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </body>
                </html>
                """.formatted(logo, escape(title), body, escape(code));
    }

    private String escape(String value) {
        if (value == null) {
            return "";
        }
        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;");
    }
}
