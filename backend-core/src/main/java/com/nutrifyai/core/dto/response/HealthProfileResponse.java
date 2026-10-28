package com.nutrifyai.core.dto.response;

import com.nutrifyai.core.entity.HealthProfile;
import com.nutrifyai.core.entity.enums.ActivityLevel;
import com.nutrifyai.core.entity.enums.DietaryPreference;
import com.nutrifyai.core.entity.enums.Gender;

import java.math.BigDecimal;
import java.util.List;

public record HealthProfileResponse(
        Long id,
        Short age,
        Gender gender,
        BigDecimal weightKg,
        BigDecimal heightCm,
        ActivityLevel activityLevel,
        DietaryPreference dietaryPreference,
        List<MedicalConditionResponse> conditions,
        List<HealthGoalResponse> goals,
        List<String> allergies
) {
    public static HealthProfileResponse from(
            HealthProfile profile,
            List<MedicalConditionResponse> conditions,
            List<HealthGoalResponse> goals,
            List<String> allergies
    ) {
        return new HealthProfileResponse(
                profile.getId(),
                profile.getAge(),
                profile.getGender(),
                profile.getWeightKg(),
                profile.getHeightCm(),
                profile.getActivityLevel(),
                profile.getDietaryPreference(),
                conditions,
                goals,
                allergies
        );
    }
}
