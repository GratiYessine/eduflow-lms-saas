package com.example.lms.billing.mapper;

import com.example.lms.billing.dto.PlanResponse;
import com.example.lms.billing.dto.SubscriptionResponse;
import com.example.lms.billing.entity.CompanySubscription;
import com.example.lms.billing.entity.SubscriptionPlan;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface BillingMapper {
    PlanResponse toResponse(SubscriptionPlan plan);

    SubscriptionResponse toResponse(CompanySubscription subscription);
}
