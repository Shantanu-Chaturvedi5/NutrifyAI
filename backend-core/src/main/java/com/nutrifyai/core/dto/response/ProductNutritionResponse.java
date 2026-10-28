package com.nutrifyai.core.dto.response;

import com.nutrifyai.core.entity.ProductNutrition;

import java.math.BigDecimal;
import java.util.Map;

public record ProductNutritionResponse(
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
        Map<String, Object> extraNutrients
) {
    public static ProductNutritionResponse from(ProductNutrition n) {
        return new ProductNutritionResponse(
                n.getServingSize(), n.getCalories(), n.getProteinG(), n.getFatG(),
                n.getSaturatedFatG(), n.getCarbsG(), n.getSugarG(), n.getFiberG(),
                n.getSodiumMg(), n.getCholesterolMg(), n.getExtraNutrients()
        );
    }
}
