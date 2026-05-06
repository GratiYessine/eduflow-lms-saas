package com.example.lms.files.dto;

import java.time.Instant;

public record FileSignedUrlResponse(
        String url,
        Instant expiresAt
) {
}
