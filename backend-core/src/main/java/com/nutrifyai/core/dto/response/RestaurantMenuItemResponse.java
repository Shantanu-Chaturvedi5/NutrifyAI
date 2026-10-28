package com.nutrifyai.core.dto.response;

import java.math.BigDecimal;

public record RestaurantMenuItemResponse(
        Long id,
        String itemName,
        BigDecimal estimatedCalories,
        BigDecimal estimatedProteinG,
        boolean isRecommended,
        String recommendationReason
) {
}