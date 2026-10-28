package com.nutrifyai.core.controller;

import com.nutrifyai.core.dto.request.LogFoodRequest;
import com.nutrifyai.core.dto.request.LogWaterRequest;
import com.nutrifyai.core.dto.response.DailyIntakeSummaryResponse;
import com.nutrifyai.core.security.SecurityUser;
import com.nutrifyai.core.service.IntakeTrackingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/v1/intake")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Intake Tracking", description = "Log food/water consumed and see remaining calories/protein/water against your diet plan or profile-based targets")
public class IntakeTrackingController {

    private final IntakeTrackingService intakeTrackingService;

    @GetMapping("/summary")
    @Operation(summary = "Get a day's targets, consumed totals, remaining amounts, and logged entries (defaults to today)")
    public ResponseEntity<DailyIntakeSummaryResponse> getSummary(
            @AuthenticationPrincipal SecurityUser currentUser,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        return ResponseEntity.ok(intakeTrackingService.getDailySummary(currentUser.getId(), date != null ? date : LocalDate.now()));
    }

    @PostMapping("/food")
    @Operation(summary = "Log a food entry — either a real product (productId) or free text (description + calories)")
    public ResponseEntity<DailyIntakeSummaryResponse> logFood(
            @AuthenticationPrincipal SecurityUser currentUser,
            @Valid @RequestBody LogFoodRequest request
    ) {
        return ResponseEntity.ok(intakeTrackingService.logFood(currentUser.getId(), request));
    }

    @PostMapping("/water")
    @Operation(summary = "Log a water entry")
    public ResponseEntity<DailyIntakeSummaryResponse> logWater(
            @AuthenticationPrincipal SecurityUser currentUser,
            @Valid @RequestBody LogWaterRequest request
    ) {
        return ResponseEntity.ok(intakeTrackingService.logWater(currentUser.getId(), request.waterMl()));
    }

    @DeleteMapping("/{entryId}")
    @Operation(summary = "Remove a logged entry")
    public ResponseEntity<DailyIntakeSummaryResponse> deleteEntry(
            @AuthenticationPrincipal SecurityUser currentUser,
            @PathVariable Long entryId
    ) {
        return ResponseEntity.ok(intakeTrackingService.deleteEntry(currentUser.getId(), entryId));
    }
}