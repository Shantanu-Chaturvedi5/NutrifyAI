package com.nutrifyai.core.dto.response;

import com.nutrifyai.core.entity.HealthProfileHistory;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record HealthHistoryResponse(
        OffsetDateTime recordedAt,
        BigDecimal weightKg,
        BigDecimal heightCm
) {
    public static HealthHistoryResponse from(HealthProfileHistory h) {
        return new HealthHistoryResponse(h.getRecordedAt(), h.getWeightKg(), h.getHeightCm());
    }
}