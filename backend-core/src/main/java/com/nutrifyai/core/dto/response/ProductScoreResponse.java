package com.nutrifyai.core.dto.response;

import java.util.List;

public record ProductScoreResponse(
        Long productId,
        Integer suitabilityScore,
        Integer healthScore,
        Integer nutritionScore,
        Integer riskScore,
        List<String> reasoning,
        String recommendedDailyQuantity,
        String maxDailyQuantity
) {
}
