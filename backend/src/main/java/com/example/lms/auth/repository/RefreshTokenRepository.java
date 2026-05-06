package com.example.lms.auth.repository;

import com.example.lms.auth.entity.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
    Optional<RefreshToken> findByTokenHash(String tokenHash);

    @Modifying
    @Query("update RefreshToken r set r.revokedAt = :revokedAt where r.userId = :userId and r.revokedAt is null")
    int revokeActiveTokensForUser(@Param("userId") Long userId, @Param("revokedAt") Instant revokedAt);
}
