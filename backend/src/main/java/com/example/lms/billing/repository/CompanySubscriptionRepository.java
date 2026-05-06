package com.example.lms.billing.repository;

import com.example.lms.billing.entity.CompanySubscription;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CompanySubscriptionRepository extends JpaRepository<CompanySubscription, Long> {
    Optional<CompanySubscription> findFirstByCompanyIdOrderByStartedAtDesc(Long companyId);
}
