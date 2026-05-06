package com.example.lms.security;

public interface RateLimiter {
    RateLimitResult consume(String key);
}
