package com.example.lms.security;

public record RateLimitResult(boolean allowed, long retryAfterSeconds) {
    public static RateLimitResult success() {
        return new RateLimitResult(true, 0);
    }

    public static RateLimitResult denied(long retryAfterSeconds) {
        return new RateLimitResult(false, Math.max(1, retryAfterSeconds));
    }
}
