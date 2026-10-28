package com.nutrifyai.core.dto.request;

import com.nutrifyai.core.entity.enums.ActivityLevel;
import com.nutrifyai.core.entity.enums.DietaryPreference;
import com.nutrifyai.core.entity.enums.Gender;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

import java.math.BigDecimal;

public record HealthProfileRequest(
        @Min(1) @Max(130) Short age,
        Gender gender,
        @DecimalMin(value = "1.0", message = "weightKg must be positive") BigDecimal weightKg,
        @DecimalMin(value = "1.0", message = "heightCm must be positive") BigDecimal heightCm,
        ActivityLevel activityLevel,
        DietaryPreference dietaryPreference
) {
}
