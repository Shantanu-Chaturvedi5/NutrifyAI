package com.nutrifyai.core.dto.request;

import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.List;

public record RestaurantMenuAnalysisResultRequest(
        @NotNull Boolean success,
        String failureReason,
        String restaurantNameGuess,
        List<MenuItemInput> items
) {
    public record MenuItemInput(
            String itemName,
            BigDecimal estimatedCalories,
            BigDecimal estimatedProteinG,
            Boolean isRecommended,
            String recommendationReason
    ) {
    }
}