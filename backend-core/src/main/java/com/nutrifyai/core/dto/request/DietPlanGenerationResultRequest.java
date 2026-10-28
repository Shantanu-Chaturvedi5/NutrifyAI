package com.nutrifyai.core.dto.request;

import com.nutrifyai.core.entity.enums.MealType;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.List;

/**
 * Body of the callback ai-service makes once diet plan generation
 * finishes. ai-service always generates exactly 7 unique day templates
 * regardless of how many days the plan actually needs — this backend is
 * the one that knows the plan's real day count (from planType/startDate/
 * endDate) and cycles through the 7 templates to build the actual
 * DietPlanDay rows, so ai-service's job stays purely "generate content."
 */
public record DietPlanGenerationResultRequest(
        @NotNull Boolean success,
        String failureReason,
        List<DayTemplate> dayTemplates
) {
    public record DayTemplate(List<MealInput> meals) {
    }

    public record MealInput(
            MealType mealType,
            String name,
            BigDecimal calories,
            BigDecimal proteinG,
            BigDecimal fatG,
            BigDecimal saturatedFatG,
            BigDecimal carbsG,
            BigDecimal sugarG,
            BigDecimal fiberG,
            BigDecimal sodiumMg,
            String description
    ) {
    }
}