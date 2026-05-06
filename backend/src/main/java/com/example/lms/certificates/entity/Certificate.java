package com.example.lms.certificates.entity;

import com.example.lms.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "certificates", uniqueConstraints = @UniqueConstraint(name = "uk_certificates_learner_training", columnNames = {"learner_id", "training_id"}))
public class Certificate extends BaseEntity {

    @Column(nullable = false, unique = true, length = 80)
    private String certificateNumber;

    @Column(nullable = false)
    private Long learnerId;

    @Column(nullable = false)
    private Long trainingId;

    @Column(nullable = false)
    private Long trainerId;

    @Column(nullable = false)
    private Instant issuedAt;

    @Column(nullable = false)
    private String fileUrl;

    @Column(nullable = false)
    private Long fileId;

    @Column(nullable = false, unique = true, length = 80)
    private String verificationCode;
}
