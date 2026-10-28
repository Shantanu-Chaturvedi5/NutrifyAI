package com.nutrifyai.core.dto.request;

import com.nutrifyai.core.entity.enums.PlanType;
import jakarta.validation.constraints.NotNull;

public record GenerateDietPlanRequest(
        @NotNull PlanType planType
) {
}