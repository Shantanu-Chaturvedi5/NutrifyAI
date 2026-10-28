package com.nutrifyai.core.dto.request;

import jakarta.validation.constraints.NotBlank;

import java.math.BigDecimal;
import java.time.LocalDate;

public record AddHealthGoalRequest(
        @NotBlank String goalCode,   // e.g. "WEIGHT_LOSS" — see health_goals seed data
        BigDecimal targetValue,
        LocalDate targetDate
) {
}
