package com.nutrifyai.core.dto.response;

import com.nutrifyai.core.entity.DietPlan;
import com.nutrifyai.core.entity.enums.PlanStatus;
import com.nutrifyai.core.entity.enums.PlanType;
import com.nutrifyai.core.entity.enums.ProcessingStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

public record DietPlanResponse(
        Long id,
        PlanType planType,
        BigDecimal calorieTarget,
        BigDecimal proteinTarget,
        LocalDate startDate,
        LocalDate endDate,
        PlanStatus status,
        ProcessingStatus generationStatus,
        String failureReason,
        OffsetDateTime createdAt,
        List<DietPlanDayResponse> days
) {
    public static DietPlanResponse from(DietPlan plan, List<DietPlanDayResponse> days) {
        return new DietPlanResponse(
                plan.getId(),
                plan.getPlanType(),
                plan.getCalorieTarget(),
                plan.getProteinTarget(),
                plan.getStartDate(),
                plan.getEndDate(),
                plan.getStatus(),
                plan.getGenerationStatus(),
                plan.getFailureReason(),
                plan.getCreatedAt(),
                days
        );
    }
}