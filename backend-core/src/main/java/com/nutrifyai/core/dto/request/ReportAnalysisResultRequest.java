package com.nutrifyai.core.dto.request;

import com.nutrifyai.core.entity.enums.ValueStatus;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

/**
 * Body of the callback the AI service (Phase 4) makes back to this backend
 * once a medical report finishes OCR + analysis.
 */
public record ReportAnalysisResultRequest(
        @NotNull Boolean success,
        String failureReason,
        Map<String, Object> rawExtraction,
        List<ExtractedValue> extractedValues
) {
    public record ExtractedValue(
            String parameterName,
            BigDecimal value,
            String unit,
            BigDecimal referenceRangeLow,
            BigDecimal referenceRangeHigh,
            ValueStatus status
    ) {
    }
}
