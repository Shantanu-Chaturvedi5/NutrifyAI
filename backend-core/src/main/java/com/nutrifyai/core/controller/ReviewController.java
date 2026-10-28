package com.nutrifyai.core.controller;

import com.nutrifyai.core.dto.request.ReviewRequest;
import com.nutrifyai.core.dto.response.PagedResponse;
import com.nutrifyai.core.dto.response.ReviewResponse;
import com.nutrifyai.core.security.SecurityUser;
import com.nutrifyai.core.service.ReviewService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/products/{productId}/reviews")
@RequiredArgsConstructor
@Tag(name = "Reviews", description = "Free-text product reviews")
public class ReviewController {

    private final ReviewService reviewService;

    @GetMapping
    @Operation(summary = "List reviews for a product, newest first")
    public ResponseEntity<PagedResponse<ReviewResponse>> list(@PathVariable Long productId, Pageable pageable) {
        return ResponseEntity.ok(reviewService.listForProduct(productId, pageable));
    }

    @PostMapping
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Write a review for a product")
    public ResponseEntity<ReviewResponse> create(
            @AuthenticationPrincipal SecurityUser currentUser,
            @PathVariable Long productId,
            @Valid @RequestBody ReviewRequest request
    ) {
        ReviewResponse response = reviewService.create(currentUser.getId(), productId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
