package com.nutrifyai.core.dto.response;

import com.nutrifyai.core.entity.enums.ProcessingStatus;

import java.time.OffsetDateTime;
import java.util.List;

public record RestaurantMenuResponse(
        Long id,
        String restaurantName,
        ProcessingStatus processingStatus,
        String failureReason,
        OffsetDateTime uploadedAt,
        List<RestaurantMenuItemResponse> items
) {
}