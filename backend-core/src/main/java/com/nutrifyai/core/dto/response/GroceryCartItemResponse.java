package com.nutrifyai.core.dto.response;

public record GroceryCartItemResponse(
        Long id,
        Long productId,
        String productName,
        String productImageUrl,
        String rawItemName,
        short quantity,
        String unit
) {
}