package com.example.lms.security;

import com.example.lms.users.entity.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.Map;

@Service
public class JwtService {

    private final SecretKey key;
    private final long accessExpirationMillis;

    public JwtService(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.access-expiration-ms}") long accessExpirationMillis
    ) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.accessExpirationMillis = accessExpirationMillis;
    }

    public String generateAccessToken(User user) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(user.getEmail())
                .claims(Map.of(
                        "userId", user.getId(),
                        "role", user.getRole().name(),
                        "companyId", user.getCompanyId() == null ? "" : user.getCompanyId(),
                        "tokenVersion", user.getTokenVersion()
                ))
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusMillis(accessExpirationMillis)))
                .signWith(key)
                .compact();
    }

    public String extractEmail(String token) {
        return claims(token).getSubject();
    }

    public boolean isValid(String token, UserPrincipal principal) {
        return principal != null
                && principal.getUsername().equals(extractEmail(token))
                && principal.isEnabled()
                && principal.isAccountNonLocked()
                && principal.getTokenVersion() == extractTokenVersion(token)
                && !isExpired(token);
    }

    private int extractTokenVersion(String token) {
        Object value = claims(token).get("tokenVersion");
        if (value instanceof Number number) {
            return number.intValue();
        }
        return -1;
    }

    private boolean isExpired(String token) {
        return claims(token).getExpiration().before(new Date());
    }

    private Claims claims(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
