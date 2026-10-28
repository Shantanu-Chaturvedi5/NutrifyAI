package com.nutrifyai.core.dto.response;

import java.time.OffsetDateTime;
import java.util.List;

public record GroceryCartResponse(
        Long id,
        Short cartHealthScore,
        int analyzedItemCount,
        OffsetDateTime uploadedAt,
        List<GroceryCartItemResponse> items
) {
}