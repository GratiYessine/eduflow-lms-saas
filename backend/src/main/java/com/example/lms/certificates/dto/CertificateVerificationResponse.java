package com.example.lms.certificates.dto;

import java.time.Instant;

public record CertificateVerificationResponse(
        boolean valid,
        String certificateNumber,
        Long learnerId,
        Long trainingId,
        Instant issuedAt
) {
}
