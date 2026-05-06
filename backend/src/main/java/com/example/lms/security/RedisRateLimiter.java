package com.example.lms.security;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Component;

import java.util.List;

@Slf4j
@Component
@ConditionalOnProperty(name = "app.security.auth-rate-limit.backend", havingValue = "redis", matchIfMissing = true)
public class RedisRateLimiter implements RateLimiter {

    private static final String SCRIPT = """
            local current = redis.call('INCR', KEYS[1])
            if current == 1 then
              redis.call('PEXPIRE', KEYS[1], ARGV[2])
            end
            local ttl = redis.call('PTTL', KEYS[1])
            if current > tonumber(ARGV[1]) then
              return {0, ttl}
            end
            return {1, ttl}
            """;

    private final StringRedisTemplate redisTemplate;
    private final DefaultRedisScript<List> script;
    private final int maxRequests;
    private final long windowMillis;

    public RedisRateLimiter(
            StringRedisTemplate redisTemplate,
            @Value("${app.security.auth-rate-limit.max-requests:20}") int maxRequests,
            @Value("${app.security.auth-rate-limit.window-ms:60000}") long windowMillis
    ) {
        this.redisTemplate = redisTemplate;
        this.script = new DefaultRedisScript<>(SCRIPT, List.class);
        this.maxRequests = maxRequests;
        this.windowMillis = windowMillis;
    }

    @Override
    public RateLimitResult consume(String key) {
        List<?> result = redisTemplate.execute(script, List.of("rate-limit:auth:" + key), String.valueOf(maxRequests), String.valueOf(windowMillis));
        if (result == null || result.isEmpty()) {
            log.warn("rate_limit_redis_empty_result key={}", key);
            return RateLimitResult.success();
        }
        boolean allowed = asLong(result.get(0)) == 1;
        long retryAfterMillis = result.size() > 1 ? asLong(result.get(1)) : windowMillis;
        return allowed ? RateLimitResult.success() : RateLimitResult.denied((retryAfterMillis + 999) / 1000);
    }

    private long asLong(Object value) {
        if (value instanceof Number number) {
            return number.longValue();
        }
        return Long.parseLong(String.valueOf(value));
    }
}
