package com.nutrifyai.core.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record DailyIntakeSummaryResponse(
        LocalDate date,
        BigDecimal calorieTarget,
        BigDecimal proteinTarget,
        BigDecimal waterTargetMl,
        BigDecimal consumedCalories,
        BigDecimal consumedProteinG,
        BigDecimal consumedWaterMl,
        BigDecimal remainingCalories,
        BigDecimal remainingProteinG,
        BigDecimal remainingWaterMl,
        // True when targets came from the profile's Mifflin-St Jeor
        // calculation because there's no active diet plan — the frontend
        // can use this to say "based on your profile" vs "based on your
        // diet plan" without guessing.
        boolean targetsFromActivePlan,
        List<IntakeLogEntryResponse> entries
) {
}