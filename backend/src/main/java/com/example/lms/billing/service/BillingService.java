package com.example.lms.billing.service;

import com.example.lms.billing.dto.PlanResponse;
import com.example.lms.billing.dto.SubscriptionResponse;
import com.example.lms.billing.mapper.BillingMapper;
import com.example.lms.billing.repository.CompanySubscriptionRepository;
import com.example.lms.billing.repository.SubscriptionPlanRepository;
import com.example.lms.common.exception.ResourceNotFoundException;
import com.example.lms.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BillingService {

    private final SubscriptionPlanRepository planRepository;
    private final CompanySubscriptionRepository subscriptionRepository;
    private final BillingMapper billingMapper;

    @Transactional(readOnly = true)
    @Cacheable(value = "billingPlans", key = "'all'")
    public List<PlanResponse> plans() {
        return planRepository.findAll().stream().map(billingMapper::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public SubscriptionResponse mySubscription() {
        Long companyId = SecurityUtils.currentCompanyId();
        return subscriptionRepository.findFirstByCompanyIdOrderByStartedAtDesc(companyId)
                .map(billingMapper::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Subscription not found"));
    }
}
