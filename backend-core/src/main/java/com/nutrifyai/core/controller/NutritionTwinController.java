package com.nutrifyai.core.controller;

import com.nutrifyai.core.dto.response.NutritionTwinResponse;
import com.nutrifyai.core.security.SecurityUser;
import com.nutrifyai.core.service.NutritionTwinService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/nutrition-twin")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Nutrition Twin", description = "Trend and risk projections computed from your report history — a linear trend, not a clinical risk model")
public class NutritionTwinController {

    private final NutritionTwinService nutritionTwinService;

    @GetMapping
    @Operation(summary = "Get the most recent nutrition twin snapshot")
    public ResponseEntity<NutritionTwinResponse> getLatest(@AuthenticationPrincipal SecurityUser currentUser) {
        return ResponseEntity.ok(nutritionTwinService.getLatest(currentUser.getId()));
    }

    @PostMapping("/generate")
    @Operation(summary = "Recompute the nutrition twin from current report history")
    public ResponseEntity<NutritionTwinResponse> generate(@AuthenticationPrincipal SecurityUser currentUser) {
        return ResponseEntity.ok(nutritionTwinService.generate(currentUser.getId()));
    }
}
