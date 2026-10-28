package com.nutrifyai.core.dto.response;

import java.time.LocalDate;
import java.util.List;

public record DietPlanDayResponse(
        short dayNumber,
        LocalDate planDate,
        List<DietPlanMealResponse> meals
) {
}