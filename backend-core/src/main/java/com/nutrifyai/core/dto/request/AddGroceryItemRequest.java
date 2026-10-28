package com.nutrifyai.core.dto.request;

import jakarta.validation.constraints.Min;

/**
 * Either productId is set (adding a real catalog product — its name is
 * looked up server-side, rawItemName is ignored if also sent) or
 * rawItemName is set (a free-text item with nothing behind it). Exactly
 * one of the two is expected; the service validates this.
 */
public record AddGroceryItemRequest(
        Long productId,
        String rawItemName,
        @Min(1) Short quantity,
        String unit
) {
    public AddGroceryItemRequest {
        if (quantity == null) quantity = 1;
        if (unit == null || unit.isBlank()) unit = "pack";
    }
}