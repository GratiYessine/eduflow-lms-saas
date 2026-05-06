package com.example.lms.users.entity;

import com.example.lms.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "users")
public class User extends BaseEntity {

    @Column(nullable = false, length = 80)
    private String firstName;

    @Column(nullable = false, length = 80)
    private String lastName;

    @Column(nullable = false, unique = true, length = 180)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(length = 40)
    private String phone;

    private String avatarUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private Role role;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private UserStatus status = UserStatus.PENDING;

    private Long companyId;

    @Column(nullable = false)
    private int failedLoginAttempts;

    private Instant lockedUntil;

    private Instant lastLoginAt;

    private Instant passwordChangedAt;

    @Column(nullable = false)
    private int tokenVersion;

    public boolean isActive() {
        return status == UserStatus.ACTIVE;
    }

    public boolean isLoginLocked() {
        return lockedUntil != null && lockedUntil.isAfter(Instant.now());
    }
}
