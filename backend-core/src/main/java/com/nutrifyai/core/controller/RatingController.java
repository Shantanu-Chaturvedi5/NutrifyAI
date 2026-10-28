package com.nutrifyai.core.controller;

import com.nutrifyai.core.dto.request.RatingRequest;
import com.nutrifyai.core.dto.response.RatingResponse;
import com.nutrifyai.core.security.SecurityUser;
import com.nutrifyai.core.service.RatingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/products/{productId}/ratings")
@RequiredArgsConstructor
@Tag(name = "Ratings", description = "Taste/healthiness/digestibility/satisfaction ratings and the derived community health score")
public class RatingController {

    private final RatingService ratingService;

    @GetMapping
    @Operation(summary = "List all ratings for a product")
    public ResponseEntity<List<RatingResponse>> list(@PathVariable Long productId) {
        return ResponseEntity.ok(ratingService.listForProduct(productId));
    }

    @GetMapping("/me")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Get my own rating for a product, if I've rated it")
    public ResponseEntity<RatingResponse> getMine(
            @AuthenticationPrincipal SecurityUser currentUser,
            @PathVariable Long productId
    ) {
        return ratingService.getMine(currentUser.getId(), productId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }

    @GetMapping("/community-score")
    @Operation(summary = "Community Health Score — average healthiness rating, scaled to 0-100")
    public ResponseEntity<Map<String, Object>> communityScore(@PathVariable Long productId) {
        Double score = ratingService.communityHealthScore(productId);
        // Map.of() throws NullPointerException on a null value — and score
        // IS null for every product with zero ratings, i.e. every freshly
        // seeded/scanned product. Use a null-tolerant map instead.
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("productId", productId);
        body.put("communityHealthScore", score);
        return ResponseEntity.ok(body);
    }

    @PutMapping
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Rate a product (creates or updates my existing rating)")
    public ResponseEntity<RatingResponse> upsert(
            @AuthenticationPrincipal SecurityUser currentUser,
            @PathVariable Long productId,
            @Valid @RequestBody RatingRequest request
    ) {
        return ResponseEntity.ok(ratingService.upsert(currentUser.getId(), productId, request));
    }
}