package com.example.lms.users.entity;

import com.example.lms.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "trainer_profiles")
public class TrainerProfile extends BaseEntity {

    @Column(nullable = false, unique = true)
    private Long userId;

    @Column(columnDefinition = "text")
    private String bio;

    @Column(columnDefinition = "text")
    private String expertise;

    private String portfolioUrl;

    @Column(columnDefinition = "text")
    private String socialLinks;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private TrainerVerificationStatus verificationStatus = TrainerVerificationStatus.APPROVED;

    @Column(columnDefinition = "text")
    private String motivation;

    private String cvUrl;

    private String certificateUrl;

    private String diplomaUrl;

    @Column(columnDefinition = "text")
    private String rejectionReason;

    private Instant approvedAt;

    private Long approvedBy;

    @Column(nullable = false, precision = 3, scale = 2)
    private BigDecimal rating = BigDecimal.ZERO;

    @Column(nullable = false)
    private int totalTrainings;
}
