package com.nutrifyai.core.service;

import com.nutrifyai.core.dto.request.RatingRequest;
import com.nutrifyai.core.dto.response.RatingResponse;
import com.nutrifyai.core.entity.Product;
import com.nutrifyai.core.entity.Rating;
import com.nutrifyai.core.entity.User;
import com.nutrifyai.core.exception.ResourceNotFoundException;
import com.nutrifyai.core.repository.ProductRepository;
import com.nutrifyai.core.repository.RatingRepository;
import com.nutrifyai.core.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class RatingService {

    private final RatingRepository ratingRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    /** One rating per (product, user) — a resubmission updates the existing row. */
    @Transactional
    public RatingResponse upsert(Long userId, Long productId, RatingRequest request) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found."));

        Rating rating = ratingRepository.findByProductIdAndUserId(productId, userId)
                .orElseGet(() -> Rating.builder()
                        .product(product)
                        .user(userRepository.getReferenceById(userId))
                        .build());

        rating.setTasteRating(request.tasteRating());
        rating.setHealthinessRating(request.healthinessRating());
        rating.setDigestibilityRating(request.digestibilityRating());
        rating.setSatisfactionRating(request.satisfactionRating());

        return RatingResponse.from(ratingRepository.save(rating));
    }

    @Transactional(readOnly = true)
    public List<RatingResponse> listForProduct(Long productId) {
        return ratingRepository.findAllByProductId(productId).stream()
                .map(RatingResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public Optional<RatingResponse> getMine(Long userId, Long productId) {
        return ratingRepository.findByProductIdAndUserId(productId, userId).map(RatingResponse::from);
    }

    /** Simple "Community Health Score" — average of everyone's healthiness_rating, on a 0-100 scale. */
    @Transactional(readOnly = true)
    public Double communityHealthScore(Long productId) {
        Double avgOutOfFive = ratingRepository.averageHealthinessRating(productId);
        return avgOutOfFive == null ? null : Math.round(avgOutOfFive / 5.0 * 100.0 * 10.0) / 10.0;
    }
}
