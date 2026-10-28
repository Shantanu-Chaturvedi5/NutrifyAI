package com.nutrifyai.core.dto.response;

import com.nutrifyai.core.entity.enums.MealType;

import java.math.BigDecimal;

public record DietPlanMealResponse(
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