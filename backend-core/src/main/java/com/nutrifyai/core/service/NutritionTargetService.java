package com.nutrifyai.core.service;

import com.nutrifyai.core.entity.HealthProfile;
import com.nutrifyai.core.entity.enums.ActivityLevel;
import com.nutrifyai.core.entity.enums.Gender;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Set;

/**
 * Deterministic (not LLM-guessed) daily nutrition targets — calorie and
 * protein targets are numbers a user might plan their eating around, so
 * they come from a real formula (Mifflin-St Jeor BMR * activity
 * multiplier, adjusted for goal), not something that can hallucinate.
 * Extracted out of DietPlanService (which had this logic first) so
 * IntakeTrackingService can show "remaining today" using the exact same
 * numbers even for a user with no diet plan generated yet.
 */
@Service
public class NutritionTargetService {

    private static final Set<String> WEIGHT_LOSS_GOALS = Set.of("WEIGHT_LOSS");
    private static final Set<String> FAT_LOSS_GOALS = Set.of("FAT_LOSS");
    private static final Set<String> MUSCLE_GAIN_GOALS = Set.of("MUSCLE_GAIN");
    private static final Set<String> WEIGHT_GAIN_GOALS = Set.of("WEIGHT_GAIN");

    public record Targets(BigDecimal calorieTarget, BigDecimal proteinTarget, BigDecimal waterTargetMl) {
    }

    public Targets compute(HealthProfile profile, List<String> goalCodes) {
        double weight = profile.getWeightKg().doubleValue();
        double height = profile.getHeightCm().doubleValue();
        int age = profile.getAge();
        Gender gender = profile.getGender();

        double bmr;
        if (gender == Gender.MALE) {
            bmr = 10 * weight + 6.25 * height - 5 * age + 5;
        } else if (gender == Gender.FEMALE) {
            bmr = 10 * weight + 6.25 * height - 5 * age - 161;
        } else {
            // No gender-specific formula applies — use the midpoint of the
            // male/female constants rather than defaulting to either.
            bmr = 10 * weight + 6.25 * height - 5 * age - 78;
        }

        ActivityLevel activityLevel = profile.getActivityLevel() != null ? profile.getActivityLevel() : ActivityLevel.SEDENTARY;
        double activityMultiplier = switch (activityLevel) {
            case SEDENTARY -> 1.2;
            case LIGHT -> 1.375;
            case MODERATE -> 1.55;
            case ACTIVE -> 1.725;
            case VERY_ACTIVE -> 1.9;
        };

        double tdee = bmr * activityMultiplier;

        double calorieAdjustment = 0;
        if (goalCodes.stream().anyMatch(WEIGHT_LOSS_GOALS::contains)) calorieAdjustment = -500;
        else if (goalCodes.stream().anyMatch(FAT_LOSS_GOALS::contains)) calorieAdjustment = -300;
        else if (goalCodes.stream().anyMatch(MUSCLE_GAIN_GOALS::contains)) calorieAdjustment = 300;
        else if (goalCodes.stream().anyMatch(WEIGHT_GAIN_GOALS::contains)) calorieAdjustment = 500;

        double calorieTarget = tdee + calorieAdjustment;
        double proteinPerKg = goalCodes.stream().anyMatch(MUSCLE_GAIN_GOALS::contains) ? 2.0 : 1.6;
        double proteinTarget = weight * proteinPerKg;

        // 33ml per kg body weight — a commonly-cited hydration guideline.
        double waterTargetMl = weight * 33;

        return new Targets(round(calorieTarget), round(proteinTarget), round(waterTargetMl));
    }

    /** Used only when weight isn't on file at all — water target needs
     * just weight, so this covers a user who hasn't completed their full
     * profile (age/height too) but still wants a hydration number. */
    public BigDecimal defaultWaterTargetMl() {
        return BigDecimal.valueOf(2500);
    }

    private BigDecimal round(double value) {
        return BigDecimal.valueOf(value).setScale(2, RoundingMode.HALF_UP);
    }
}