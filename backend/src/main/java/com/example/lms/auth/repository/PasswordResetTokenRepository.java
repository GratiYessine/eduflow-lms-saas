package com.example.lms.auth.repository;

import com.example.lms.auth.entity.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Optional;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {
    Optional<PasswordResetToken> findByTokenHash(String tokenHash);

    @Modifying
    @Query("update PasswordResetToken p set p.usedAt = :usedAt where p.userId = :userId and p.usedAt is null")
    int markOutstandingTokensUsed(@Param("userId") Long userId, @Param("usedAt") Instant usedAt);
}
