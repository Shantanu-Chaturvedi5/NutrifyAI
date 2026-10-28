package com.nutrifyai.core.dto.response;

import com.nutrifyai.core.entity.Review;

import java.time.OffsetDateTime;

public record ReviewResponse(
        Long id,
        Long userId,
        String userFullName,
        String reviewText,
        OffsetDateTime createdAt
) {
    public static ReviewResponse from(Review review) {
        return new ReviewResponse(
                review.getId(),
                review.getUser().getId(),
                review.getUser().getFullName(),
                review.getReviewText(),
                review.getCreatedAt()
        );
    }
}
