package com.nutrifyai.core.dto.request;

import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;

/**
 * Either productId is set (a real catalog product — its calories/proteinG
 * are looked up server-side, multiplied by quantity; description/calories/
 * proteinG are ignored if also sent) or description+calories are set (a
 * free-text entry with manually-entered values). The service validates
 * exactly one of these shapes is used.
 */
public record LogFoodRequest(
        Long productId,
        String description,
        @PositiveOrZero BigDecimal calories,
        @PositiveOrZero BigDecimal proteinG,
        @PositiveOrZero Double quantity
) {
    public LogFoodRequest {
        if (quantity == null) quantity = 1.0;
    }
}