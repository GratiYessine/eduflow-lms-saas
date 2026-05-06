package com.example.lms.billing.entity;

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
@Table(name = "company_subscriptions")
public class CompanySubscription extends BaseEntity {

    @Column(nullable = false)
    private Long companyId;

    @Column(nullable = false)
    private Long planId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private SubscriptionStatus status = SubscriptionStatus.TRIALING;

    @Column(nullable = false)
    private Instant startedAt;

    private Instant expiresAt;
}
