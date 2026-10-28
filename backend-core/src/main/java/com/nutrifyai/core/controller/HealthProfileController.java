package com.nutrifyai.core.controller;

import com.nutrifyai.core.dto.request.AddAllergyRequest;
import com.nutrifyai.core.dto.request.AddHealthGoalRequest;
import com.nutrifyai.core.dto.request.AddMedicalConditionRequest;
import com.nutrifyai.core.dto.request.HealthProfileRequest;
import com.nutrifyai.core.dto.response.HealthProfileResponse;
import com.nutrifyai.core.security.SecurityUser;
import com.nutrifyai.core.service.HealthProfileService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import com.nutrifyai.core.dto.response.HealthHistoryResponse;
import java.util.List;

@RestController
@RequestMapping("/api/v1/health-profile")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Health Profile", description = "Age/weight/activity, medical conditions, goals, allergies")
public class HealthProfileController {

    private final HealthProfileService healthProfileService;

    @GetMapping
    @Operation(summary = "Get my health profile")
    public ResponseEntity<HealthProfileResponse> get(@AuthenticationPrincipal SecurityUser currentUser) {
        return ResponseEntity.ok(healthProfileService.get(currentUser.getId()));
    }

    @PutMapping
    @Operation(summary = "Create or update my health profile (age, weight, activity level, etc.)")
    public ResponseEntity<HealthProfileResponse> upsert(
            @AuthenticationPrincipal SecurityUser currentUser,
            @Valid @RequestBody HealthProfileRequest request
    ) {
        return ResponseEntity.ok(healthProfileService.upsert(currentUser.getId(), request));
    }

    @PostMapping("/conditions")
    @Operation(summary = "Add a medical condition (e.g. DIABETES, HYPERTENSION)")
    public ResponseEntity<HealthProfileResponse> addCondition(
            @AuthenticationPrincipal SecurityUser currentUser,
            @Valid @RequestBody AddMedicalConditionRequest request
    ) {
        return ResponseEntity.ok(healthProfileService.addCondition(currentUser.getId(), request));
    }

    @DeleteMapping("/conditions/{conditionId}")
    @Operation(summary = "Remove a medical condition")
    public ResponseEntity<Void> removeCondition(
            @AuthenticationPrincipal SecurityUser currentUser,
            @PathVariable Short conditionId
    ) {
        healthProfileService.removeCondition(currentUser.getId(), conditionId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/goals")
    @Operation(summary = "Add a health goal (e.g. WEIGHT_LOSS, MUSCLE_GAIN)")
    public ResponseEntity<HealthProfileResponse> addGoal(
            @AuthenticationPrincipal SecurityUser currentUser,
            @Valid @RequestBody AddHealthGoalRequest request
    ) {
        return ResponseEntity.ok(healthProfileService.addGoal(currentUser.getId(), request));
    }

    @PostMapping("/allergies")
    @Operation(summary = "Add a food allergy")
    public ResponseEntity<HealthProfileResponse> addAllergy(
            @AuthenticationPrincipal SecurityUser currentUser,
            @Valid @RequestBody AddAllergyRequest request
    ) {
        return ResponseEntity.ok(healthProfileService.addAllergy(currentUser.getId(), request));
    }
        @GetMapping("/history")
    @Operation(summary = "Weight and height history for progress charts")
    public ResponseEntity<List<HealthHistoryResponse>> history(
            @AuthenticationPrincipal SecurityUser currentUser
    ) {
        return ResponseEntity.ok(healthProfileService.history(currentUser.getId()));
    }
        @DeleteMapping("/conditions/by-code/{code}")
    @Operation(summary = "Remove a medical condition by its code")
    public ResponseEntity<HealthProfileResponse> removeConditionByCode(
            @AuthenticationPrincipal SecurityUser currentUser, @PathVariable String code) {
        return ResponseEntity.ok(healthProfileService.removeConditionByCode(currentUser.getId(), code));
    }

    @PutMapping("/conditions/by-code/{code}")
    @Operation(summary = "Change severity / notes of a medical condition")
    public ResponseEntity<HealthProfileResponse> updateCondition(
            @AuthenticationPrincipal SecurityUser currentUser, @PathVariable String code,
            @Valid @RequestBody AddMedicalConditionRequest request) {
        return ResponseEntity.ok(healthProfileService.updateCondition(currentUser.getId(), code, request));
    }

    @DeleteMapping("/goals/by-code/{code}")
    @Operation(summary = "Remove a health goal by its code")
    public ResponseEntity<HealthProfileResponse> removeGoalByCode(
            @AuthenticationPrincipal SecurityUser currentUser, @PathVariable String code) {
        return ResponseEntity.ok(healthProfileService.removeGoalByCode(currentUser.getId(), code));
    }

    @PutMapping("/goals/by-code/{code}")
    @Operation(summary = "Change target value / date of a health goal")
    public ResponseEntity<HealthProfileResponse> updateGoal(
            @AuthenticationPrincipal SecurityUser currentUser, @PathVariable String code,
            @Valid @RequestBody AddHealthGoalRequest request) {
        return ResponseEntity.ok(healthProfileService.updateGoal(currentUser.getId(), code, request));
    }

    @DeleteMapping("/allergies")
    @Operation(summary = "Remove an allergy by name")
    public ResponseEntity<HealthProfileResponse> removeAllergy(
            @AuthenticationPrincipal SecurityUser currentUser, @RequestParam String name) {
        return ResponseEntity.ok(healthProfileService.removeAllergyByName(currentUser.getId(), name));
    }

    @PutMapping("/allergies")
    @Operation(summary = "Rename an allergy")
    public ResponseEntity<HealthProfileResponse> renameAllergy(
            @AuthenticationPrincipal SecurityUser currentUser, @RequestParam String name,
            @Valid @RequestBody AddAllergyRequest request) {
        return ResponseEntity.ok(healthProfileService.renameAllergy(currentUser.getId(), name, request));
    }
}