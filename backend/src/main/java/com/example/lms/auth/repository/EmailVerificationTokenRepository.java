package com.example.lms.auth.repository;

import com.example.lms.auth.entity.EmailVerificationToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Optional;

public interface EmailVerificationTokenRepository extends JpaRepository<EmailVerificationToken, Long> {
    Optional<EmailVerificationToken> findByTokenHash(String tokenHash);

    @Modifying
    @Query("update EmailVerificationToken e set e.verifiedAt = :verifiedAt where e.userId = :userId and e.verifiedAt is null")
    int markOutstandingTokensVerified(@Param("userId") Long userId, @Param("verifiedAt") Instant verifiedAt);
}
