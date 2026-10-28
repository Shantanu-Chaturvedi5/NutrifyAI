package com.nutrifyai.core.dto.response;

import com.nutrifyai.core.entity.Rating;

public record RatingResponse(
        Long id,
        Short tasteRating,
        Short healthinessRating,
        Short digestibilityRating,
        Short satisfactionRating
) {
    public static RatingResponse from(Rating rating) {
        return new RatingResponse(
                rating.getId(),
                rating.getTasteRating(),
                rating.getHealthinessRating(),
                rating.getDigestibilityRating(),
                rating.getSatisfactionRating()
        );
    }
}
