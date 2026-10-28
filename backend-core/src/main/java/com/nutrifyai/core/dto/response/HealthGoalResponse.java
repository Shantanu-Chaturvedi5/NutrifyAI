package com.nutrifyai.core.dto.response;

import com.nutrifyai.core.entity.UserHealthGoal;

import java.math.BigDecimal;
import java.time.LocalDate;

public record HealthGoalResponse(
        String code,
        String name,
        BigDecimal targetValue,
        LocalDate targetDate
) {
    public static HealthGoalResponse from(UserHealthGoal uhg) {
        return new HealthGoalResponse(
                uhg.getGoal().getCode(),
                uhg.getGoal().getName(),
                uhg.getTargetValue(),
                uhg.getTargetDate()
        );
    }
}
