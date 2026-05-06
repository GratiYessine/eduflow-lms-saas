package com.example.lms.config;

import com.example.lms.users.entity.Role;
import com.example.lms.users.entity.User;
import com.example.lms.users.entity.UserStatus;
import com.example.lms.users.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.util.StringUtils;

@Configuration
public class BootstrapAdminConfig {
    private static final Logger log = LoggerFactory.getLogger(BootstrapAdminConfig.class);

    @Bean
    CommandLineRunner bootstrapSuperAdmin(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            @Value("${app.bootstrap.super-admin.email:}") String email,
            @Value("${app.bootstrap.super-admin.password:}") String password,
            @Value("${app.bootstrap.super-admin.first-name:Super}") String firstName,
            @Value("${app.bootstrap.super-admin.last-name:Admin}") String lastName
    ) {
        return args -> {
            if (userRepository.existsByRole(Role.SUPER_ADMIN)) {
                return;
            }
            if (!StringUtils.hasText(email) || !StringUtils.hasText(password)) {
                log.info("No SUPER_ADMIN exists. Set APP_BOOTSTRAP_SUPER_ADMIN_EMAIL and APP_BOOTSTRAP_SUPER_ADMIN_PASSWORD to create the first one.");
                return;
            }
            if (userRepository.existsByEmailIgnoreCase(email)) {
                log.warn("Bootstrap SUPER_ADMIN email already exists but no SUPER_ADMIN role is present. Skipping bootstrap.");
                return;
            }

            User user = new User();
            user.setFirstName(firstName);
            user.setLastName(lastName);
            user.setEmail(email.trim().toLowerCase());
            user.setPassword(passwordEncoder.encode(password));
            user.setRole(Role.SUPER_ADMIN);
            user.setStatus(UserStatus.ACTIVE);
            userRepository.save(user);
            log.info("Bootstrapped initial SUPER_ADMIN user email={}", user.getEmail());
        };
    }
}
