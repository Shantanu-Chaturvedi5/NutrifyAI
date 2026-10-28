package com.nutrifyai.core.dto.response;

public record ProductAlternativeResponse(
        Long productId,
        String name,
        String brand,
        String imageUrl,
        Short nutritionSimilarityPct,
        Short tasteSimilarityPct,
        Short healthScore,
        Short rank
) {
}
