package com.example.lms.auth.controller;

import com.example.lms.users.entity.Role;
import com.example.lms.users.entity.User;
import com.example.lms.users.entity.UserStatus;
import com.example.lms.users.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.UUID;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class TrainerRegistrationIntegrationTest {

    @Autowired MockMvc mockMvc;
    @Autowired UserRepository userRepository;
    @Autowired PasswordEncoder passwordEncoder;
    @Autowired ObjectMapper objectMapper;

    @Test
    void trainerApplicationRequiresSuperAdminApprovalBeforeLogin() throws Exception {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        String adminEmail = "superadmin-" + suffix + "@example.test";
        String trainerEmail = "trainer-" + suffix + "@example.test";
        String password = "Password1";
        createSuperAdmin(adminEmail, password);

        String registrationBody = registerTrainer(trainerEmail, password)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.email").value(trainerEmail))
                .andExpect(jsonPath("$.data.userStatus").value("PENDING"))
                .andExpect(jsonPath("$.data.verificationStatus").value("PENDING"))
                .andReturn()
                .getResponse()
                .getContentAsString();
        Integer trainerId = JsonPath.read(registrationBody, "$.data.trainerId");

        login(trainerEmail, password)
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Account is pending email verification"));

        markEmailVerified(trainerId.longValue());

        login(trainerEmail, password)
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Your trainer application is still under review."));

        String adminToken = loginAndReadToken(adminEmail, password);

        mockMvc.perform(patch("/api/v1/admin/trainers/{trainerId}/approve", trainerId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.userStatus").value("ACTIVE"))
                .andExpect(jsonPath("$.data.verificationStatus").value("APPROVED"));

        login(trainerEmail, password)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.user.role").value("TRAINER"))
                .andExpect(jsonPath("$.data.user.status").value("ACTIVE"));
    }

    @Test
    void superAdminCanRejectTrainerApplicationAndKeepLoginBlocked() throws Exception {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        String adminEmail = "reviewer-" + suffix + "@example.test";
        String trainerEmail = "rejected-trainer-" + suffix + "@example.test";
        String password = "Password1";
        createSuperAdmin(adminEmail, password);

        String registrationBody = registerTrainer(trainerEmail, password)
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();
        Integer trainerId = JsonPath.read(registrationBody, "$.data.trainerId");
        String adminToken = loginAndReadToken(adminEmail, password);

        mockMvc.perform(patch("/api/v1/admin/trainers/{trainerId}/reject", trainerId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("reason", "Portfolio is incomplete."))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.userStatus").value("SUSPENDED"))
                .andExpect(jsonPath("$.data.verificationStatus").value("REJECTED"))
                .andExpect(jsonPath("$.data.rejectionReason").value("Portfolio is incomplete."));

        login(trainerEmail, password)
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message", containsString("Your trainer application was rejected.")));
    }

    @Test
    void rejectedTrainerCannotUseOldAccessOrRefreshTokens() throws Exception {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        String adminEmail = "security-admin-" + suffix + "@example.test";
        String trainerEmail = "token-check-trainer-" + suffix + "@example.test";
        String password = "Password1";
        createSuperAdmin(adminEmail, password);

        String registrationBody = registerTrainer(trainerEmail, password)
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();
        Integer trainerId = JsonPath.read(registrationBody, "$.data.trainerId");
        String adminToken = loginAndReadToken(adminEmail, password);
        markEmailVerified(trainerId.longValue());

        mockMvc.perform(patch("/api/v1/admin/trainers/{trainerId}/approve", trainerId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());

        String trainerLogin = login(trainerEmail, password)
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();
        String trainerAccessToken = JsonPath.read(trainerLogin, "$.data.accessToken");
        String trainerRefreshToken = JsonPath.read(trainerLogin, "$.data.refreshToken");

        mockMvc.perform(patch("/api/v1/admin/trainers/{trainerId}/reject", trainerId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("reason", "Security review failed."))))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/v1/auth/refresh-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("refreshToken", trainerRefreshToken))))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Refresh token is invalid or expired"));

        mockMvc.perform(get("/api/v1/users/me")
                        .header("Authorization", "Bearer " + trainerAccessToken))
                .andExpect(status().isForbidden());
    }

    private org.springframework.test.web.servlet.ResultActions registerTrainer(String email, String password) throws Exception {
        MockMultipartFile cv = new MockMultipartFile(
                "cv",
                "trainer-cv.pdf",
                "application/pdf",
                "%PDF-1.4\n%EOF".getBytes(StandardCharsets.UTF_8)
        );
        return mockMvc.perform(multipart("/api/v1/auth/register-trainer")
                .file(cv)
                .param("firstName", "Taylor")
                .param("lastName", "Trainer")
                .param("email", email)
                .param("phone", "+21655555555")
                .param("password", password)
                .param("confirmPassword", password)
                .param("specialty", "Leadership enablement")
                .param("bio", "Senior trainer focused on practical enterprise learning.")
                .param("portfolioUrl", "https://trainer.example.test")
                .param("socialLinks", "https://linkedin.example.test/trainer")
                .param("motivation", "I want to help companies train teams with measurable outcomes."));
    }

    private org.springframework.test.web.servlet.ResultActions login(String email, String password) throws Exception {
        String payload = objectMapper.writeValueAsString(Map.of("email", email, "password", password));
        return mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload));
    }

    private String loginAndReadToken(String email, String password) throws Exception {
        String response = login(email, password)
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();
        return JsonPath.read(response, "$.data.accessToken");
    }

    private void createSuperAdmin(String email, String password) {
        User admin = new User();
        admin.setFirstName("Super");
        admin.setLastName("Admin");
        admin.setEmail(email);
        admin.setPassword(passwordEncoder.encode(password));
        admin.setRole(Role.SUPER_ADMIN);
        admin.setStatus(UserStatus.ACTIVE);
        userRepository.save(admin);
    }

    private void markEmailVerified(Long userId) {
        User user = userRepository.findById(userId).orElseThrow();
        user.setStatus(UserStatus.ACTIVE);
        userRepository.save(user);
    }
}
