package com.nutrifyai.core.controller;

import com.nutrifyai.core.dto.response.PeopleLikeYouItemResponse;
import com.nutrifyai.core.security.SecurityUser;
import com.nutrifyai.core.service.RecommendationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/recommendations")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Recommendations", description = "People Like You — collaborative filtering based on shared health profile attributes")
public class RecommendationController {

    private final RecommendationService recommendationService;

    @GetMapping("/people-like-you")
    @Operation(summary = "Products liked by users with a similar health profile (conditions, goals, age, activity level)")
    public ResponseEntity<List<PeopleLikeYouItemResponse>> peopleLikeYou(@AuthenticationPrincipal SecurityUser currentUser) {
        return ResponseEntity.ok(recommendationService.getPeopleLikeYou(currentUser.getId()));
    }
}
