package com.example.lms.certificates.dto;

import java.time.Instant;

public record CertificateResponse(
        Long id,
        String certificateNumber,
        Long learnerId,
        Long trainingId,
        Long trainerId,
        Instant issuedAt,
        String fileUrl,
        String verificationCode
) {
}
