package com.nutrifyai.core.dto.request;

import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.List;

/**
 * Body of the callback ai-service makes back to this backend once a
 * product label scan finishes OCR + LLM extraction. Mirrors
 * ReportAnalysisResultRequest's success/failureReason shape.
 */
public record ProductScanAnalysisResultRequest(
        @NotNull Boolean success,
        String failureReason,
        ExtractedProduct extracted
) {
    public record ExtractedProduct(
            String productNameGuess,
            String brandGuess,
            String servingSize,
            BigDecimal calories,
            BigDecimal proteinG,
            BigDecimal fatG,
            BigDecimal saturatedFatG,
            BigDecimal carbsG,
            BigDecimal sugarG,
            BigDecimal fiberG,
            BigDecimal sodiumMg,
            BigDecimal cholesterolMg,
            List<String> ingredients
    ) {
    }
}