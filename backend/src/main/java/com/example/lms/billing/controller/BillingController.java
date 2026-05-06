package com.example.lms.billing.controller;

import com.example.lms.billing.dto.PlanResponse;
import com.example.lms.billing.dto.SubscriptionResponse;
import com.example.lms.billing.service.BillingService;
import com.example.lms.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/billing")
@RequiredArgsConstructor
public class BillingController {

    private final BillingService billingService;

    @GetMapping("/plans")
    public ApiResponse<List<PlanResponse>> plans() {
        return ApiResponse.success("Plans loaded successfully", billingService.plans());
    }

    @GetMapping("/subscription/me")
    public ApiResponse<SubscriptionResponse> mySubscription() {
        return ApiResponse.success("Subscription loaded successfully", billingService.mySubscription());
    }
}
