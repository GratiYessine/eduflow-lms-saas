package com.example.lms.users.dto;

import java.math.BigDecimal;

public record TrainerWalletResponse(
        BigDecimal totalRevenue,
        BigDecimal platformCommission,
        BigDecimal netRevenue,
        long approvedPaymentsCount
) {
}
