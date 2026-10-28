package com.nutrifyai.core.dto.response;

import com.nutrifyai.core.entity.ReportExtractedValue;
import com.nutrifyai.core.entity.enums.ValueStatus;

import java.math.BigDecimal;

public record ReportExtractedValueResponse(
        String parameterName,
        BigDecimal value,
        String unit,
        BigDecimal referenceRangeLow,
        BigDecimal referenceRangeHigh,
        ValueStatus status
) {
    public static ReportExtractedValueResponse from(ReportExtractedValue v) {
        return new ReportExtractedValueResponse(
                v.getParameterName(), v.getValue(), v.getUnit(),
                v.getReferenceRangeLow(), v.getReferenceRangeHigh(), v.getStatus()
        );
    }
}
