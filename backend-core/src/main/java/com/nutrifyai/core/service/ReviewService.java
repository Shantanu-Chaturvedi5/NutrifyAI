package com.nutrifyai.core.service;

import com.nutrifyai.core.dto.request.ReviewRequest;
import com.nutrifyai.core.dto.response.PagedResponse;
import com.nutrifyai.core.dto.response.ReviewResponse;
import com.nutrifyai.core.entity.Product;
import com.nutrifyai.core.entity.Review;
import com.nutrifyai.core.entity.User;
import com.nutrifyai.core.exception.ResourceNotFoundException;
import com.nutrifyai.core.repository.ProductRepository;
import com.nutrifyai.core.repository.ReviewRepository;
import com.nutrifyai.core.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    @Transactional
    public ReviewResponse create(Long userId, Long productId, ReviewRequest request) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found."));
        User user = userRepository.getReferenceById(userId);

        Review review = Review.builder()
                .product(product)
                .user(user)
                .reviewText(request.reviewText())
                .build();

        return ReviewResponse.from(reviewRepository.save(review));
    }

    @Transactional(readOnly = true)
    public PagedResponse<ReviewResponse> listForProduct(Long productId, Pageable pageable) {
        return PagedResponse.from(
                reviewRepository.findAllByProductIdOrderByCreatedAtDesc(productId, pageable)
                        .map(ReviewResponse::from)
        );
    }
}
