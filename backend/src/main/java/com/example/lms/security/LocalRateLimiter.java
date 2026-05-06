package com.example.lms.security;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
@ConditionalOnProperty(name = "app.security.auth-rate-limit.backend", havingValue = "local")
public class LocalRateLimiter implements RateLimiter {

    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();
    private final int maxRequests;
    private final Duration window;

    public LocalRateLimiter(
            @Value("${app.security.auth-rate-limit.max-requests:20}") int maxRequests,
            @Value("${app.security.auth-rate-limit.window-ms:60000}") long windowMillis
    ) {
        this.maxRequests = maxRequests;
        this.window = Duration.ofMillis(windowMillis);
    }

    @Override
    public RateLimitResult consume(String key) {
        Bucket bucket = buckets.computeIfAbsent(key, ignored -> newBucket());
        return bucket.tryConsume(1) ? RateLimitResult.success() : RateLimitResult.denied(window.toSeconds());
    }

    private Bucket newBucket() {
        return Bucket.builder()
                .addLimit(Bandwidth.classic(maxRequests, Refill.greedy(maxRequests, window)))
                .build();
    }
}
