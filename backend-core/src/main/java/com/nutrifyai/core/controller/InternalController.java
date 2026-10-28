package com.nutrifyai.core.controller;

import com.nutrifyai.core.dto.request.DietPlanGenerationResultRequest;
import com.nutrifyai.core.dto.request.ProductScanAnalysisResultRequest;
import com.nutrifyai.core.dto.request.ReportAnalysisResultRequest;
import com.nutrifyai.core.dto.request.RestaurantMenuAnalysisResultRequest;
import com.nutrifyai.core.exception.UnauthorizedException;
import com.nutrifyai.core.service.DietPlanService;
import com.nutrifyai.core.service.MedicalReportService;
import com.nutrifyai.core.service.ProductScanService;
import com.nutrifyai.core.service.RestaurantMenuService;
import io.swagger.v3.oas.annotations.Hidden;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;

/**
 * Service-to-service endpoints called by the AI service, never by the
 * frontend. Not protected by user JWT — protected by a shared internal
 * token instead (see nutrifyai.ai-service.internal-token). Excluded from
 * Swagger since it's not part of the public API surface.
 */
@RestController
@RequestMapping("/api/v1/internal")
@RequiredArgsConstructor
@Hidden
public class InternalController {

    private final MedicalReportService medicalReportService;
    private final ProductScanService productScanService;
    private final DietPlanService dietPlanService;
    private final RestaurantMenuService restaurantMenuService;

    @Value("${nutrifyai.ai-service.internal-token}")
    private String expectedInternalToken;

    @PostMapping("/reports/{reportId}/analysis-result")
    public ResponseEntity<Void> reportAnalysisResult(
            @PathVariable Long reportId,
            @RequestHeader("X-Internal-Token") String providedToken,
            @Valid @RequestBody ReportAnalysisResultRequest request
    ) {
        if (!expectedInternalToken.equals(providedToken)) {
            throw new UnauthorizedException("Invalid internal service token.");
        }

        List<MedicalReportService.ExtractedValueInput> values = request.extractedValues() == null
                ? Collections.emptyList()
                : request.extractedValues().stream()
                        .map(v -> new MedicalReportService.ExtractedValueInput(
                                v.parameterName(), v.value(), v.unit(),
                                v.referenceRangeLow(), v.referenceRangeHigh(), v.status()))
                        .toList();

        medicalReportService.applyAnalysisResult(
                reportId,
                Boolean.TRUE.equals(request.success()),
                request.failureReason(),
                request.rawExtraction() == null ? Collections.emptyMap() : request.rawExtraction(),
                values
        );

        return ResponseEntity.noContent().build();
    }

    @PostMapping("/product-scans/{scanId}/analysis-result")
    public ResponseEntity<Void> productScanAnalysisResult(
            @PathVariable Long scanId,
            @RequestHeader("X-Internal-Token") String providedToken,
            @Valid @RequestBody ProductScanAnalysisResultRequest request
    ) {
        if (!expectedInternalToken.equals(providedToken)) {
            throw new UnauthorizedException("Invalid internal service token.");
        }

        productScanService.applyAnalysisResult(
                scanId,
                Boolean.TRUE.equals(request.success()),
                request.failureReason(),
                request.extracted()
        );

        return ResponseEntity.noContent().build();
    }

    @PostMapping("/diet-plans/{planId}/generation-result")
    public ResponseEntity<Void> dietPlanGenerationResult(
            @PathVariable Long planId,
            @RequestHeader("X-Internal-Token") String providedToken,
            @Valid @RequestBody DietPlanGenerationResultRequest request
    ) {
        if (!expectedInternalToken.equals(providedToken)) {
            throw new UnauthorizedException("Invalid internal service token.");
        }

        dietPlanService.applyGenerationResult(
                planId,
                Boolean.TRUE.equals(request.success()),
                request.failureReason(),
                request.dayTemplates()
        );

        return ResponseEntity.noContent().build();
    }

    @PostMapping("/restaurant-menus/{menuId}/analysis-result")
    public ResponseEntity<Void> restaurantMenuAnalysisResult(
            @PathVariable Long menuId,
            @RequestHeader("X-Internal-Token") String providedToken,
            @Valid @RequestBody RestaurantMenuAnalysisResultRequest request
    ) {
        if (!expectedInternalToken.equals(providedToken)) {
            throw new UnauthorizedException("Invalid internal service token.");
        }

        restaurantMenuService.applyAnalysisResult(
                menuId,
                Boolean.TRUE.equals(request.success()),
                request.failureReason(),
                request.restaurantNameGuess(),
                request.items()
        );

        return ResponseEntity.noContent().build();
    }
}