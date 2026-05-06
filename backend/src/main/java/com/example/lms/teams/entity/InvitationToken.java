package com.example.lms.teams.entity;

import com.example.lms.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "invitation_tokens")
public class InvitationToken extends BaseEntity {

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private Long teamId;

    @Column(nullable = false)
    private Long companyId;

    @Column(nullable = false)
    private Long invitedBy;

    @Column(nullable = false, unique = true, length = 128)
    private String tokenHash;

    @Column(nullable = false)
    private Instant expiresAt;

    private Instant acceptedAt;

    public boolean isActive() {
        return acceptedAt == null && expiresAt.isAfter(Instant.now());
    }
}
