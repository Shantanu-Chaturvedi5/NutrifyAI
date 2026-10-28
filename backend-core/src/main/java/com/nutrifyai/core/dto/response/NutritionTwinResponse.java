package com.nutrifyai.core.dto.response;

import com.nutrifyai.core.entity.NutritionTwinSnapshot;

import java.time.LocalDate;

public record NutritionTwinResponse(
        LocalDate snapshotDate,
        String healthTrendSummary,
        String deficiencyTrendSummary,
        String riskPredictionSummary
) {
    public static NutritionTwinResponse from(NutritionTwinSnapshot snapshot) {
        return new NutritionTwinResponse(
                snapshot.getSnapshotDate(),
                snapshot.getHealthTrendSummary(),
                snapshot.getDeficiencyTrendSummary(),
                snapshot.getRiskPredictionSummary()
        );
    }
}
