package com.nutrifyai.core.dto.response;

public record PeopleLikeYouItemResponse(
        Long productId,
        String name,
        String brand,
        double score,
        String reasoning
) {
}
