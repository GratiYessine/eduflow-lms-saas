package com.example.lms.common.util;

import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;

@Service
public class SecureTokenService {
    private final SecureRandom secureRandom = new SecureRandom();

    public String randomToken() {
        byte[] bytes = new byte[48];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    public String numericCode(int digits) {
        if (digits < 4 || digits > 10) {
            throw new IllegalArgumentException("Code digits must be between 4 and 10");
        }
        int bound = (int) Math.pow(10, digits);
        int floor = (int) Math.pow(10, digits - 1);
        return String.valueOf(floor + secureRandom.nextInt(bound - floor));
    }

    public String hash(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return Base64.getEncoder().encodeToString(digest.digest(rawToken.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 is not available", ex);
        }
    }
}
