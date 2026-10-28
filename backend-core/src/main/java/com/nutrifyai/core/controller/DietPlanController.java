package com.nutrifyai.core.controller;

import com.nutrifyai.core.dto.request.GenerateDietPlanRequest;
import com.nutrifyai.core.dto.response.DietPlanResponse;
import com.nutrifyai.core.security.SecurityUser;
import com.nutrifyai.core.service.DietPlanService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/diet-plans")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Diet Plans", description = "Personalized meal plans generated from the user's health profile and goals")
public class DietPlanController {

    private final DietPlanService dietPlanService;

    @PostMapping("/generate")
    @Operation(summary = "Generate a new diet plan (1/7/30 days), replacing any currently active one")
    public ResponseEntity<DietPlanResponse> generate(
            @AuthenticationPrincipal SecurityUser currentUser,
            @Valid @RequestBody GenerateDietPlanRequest request
    ) {
        DietPlanResponse response = dietPlanService.generate(currentUser.getId(), request.planType());
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(response);
    }

    @GetMapping("/active")
    @Operation(summary = "Get the current active diet plan, with all generated days/meals once ready")
    public ResponseEntity<DietPlanResponse> getActive(@AuthenticationPrincipal SecurityUser currentUser) {
        return ResponseEntity.ok(dietPlanService.getActive(currentUser.getId()));
    }

    @GetMapping("/{planId}")
    @Operation(summary = "Poll a specific plan's generation status")
    public ResponseEntity<DietPlanResponse> getStatus(
            @AuthenticationPrincipal SecurityUser currentUser,
            @PathVariable Long planId
    ) {
        return ResponseEntity.ok(dietPlanService.getStatus(currentUser.getId(), planId));
    }
}