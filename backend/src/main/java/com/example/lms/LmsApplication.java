package com.example.lms;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.data.domain.AuditorAware;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;

import java.util.Optional;

@SpringBootApplication
@ConfigurationPropertiesScan
@EnableCaching
@EnableJpaAuditing(auditorAwareRef = "auditorAware")
@EnableMethodSecurity
public class LmsApplication {

    public static void main(String[] args) {
        SpringApplication.run(LmsApplication.class, args);
    }

    @org.springframework.context.annotation.Bean
    AuditorAware<String> auditorAware() {
        return () -> Optional.ofNullable(com.example.lms.security.SecurityUtils.currentEmail()).or(() -> Optional.of("system"));
    }
}
