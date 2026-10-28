package com.nutrifyai.core.service;

import com.nutrifyai.core.client.AiServiceClient;
import com.nutrifyai.core.dto.request.DietPlanGenerationResultRequest;
import com.nutrifyai.core.dto.response.DietPlanDayResponse;
import com.nutrifyai.core.dto.response.DietPlanMealResponse;
import com.nutrifyai.core.dto.response.DietPlanResponse;
import com.nutrifyai.core.entity.DietPlan;
import com.nutrifyai.core.entity.DietPlanDay;
import com.nutrifyai.core.entity.DietPlanMeal;
import com.nutrifyai.core.entity.HealthProfile;
import com.nutrifyai.core.entity.User;
import com.nutrifyai.core.entity.enums.NotificationType;
import com.nutrifyai.core.entity.enums.PlanStatus;
import com.nutrifyai.core.entity.enums.PlanType;
import com.nutrifyai.core.entity.enums.ProcessingStatus;
import com.nutrifyai.core.exception.BadRequestException;
import com.nutrifyai.core.exception.ResourceNotFoundException;
import com.nutrifyai.core.repository.DietPlanDayRepository;
import com.nutrifyai.core.repository.DietPlanMealRepository;
import com.nutrifyai.core.repository.DietPlanRepository;
import com.nutrifyai.core.repository.HealthProfileRepository;
import com.nutrifyai.core.repository.UserHealthGoalRepository;
import com.nutrifyai.core.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class DietPlanService {

    private final DietPlanRepository dietPlanRepository;
    private final DietPlanDayRepository dietPlanDayRepository;
    private final DietPlanMealRepository dietPlanMealRepository;
    private final HealthProfileRepository healthProfileRepository;
    private final UserHealthGoalRepository userHealthGoalRepository;
    private final UserRepository userRepository;
    private final HealthContextService healthContextService;
    private final NutritionTargetService nutritionTargetService;
    private final AiServiceClient aiServiceClient;
    private final NotificationService notificationService;

    @Transactional
    public DietPlanResponse generate(Long userId, PlanType planType) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));

        HealthProfile profile = healthProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new BadRequestException(
                        "Complete your health profile (age, weight, height) on the Profile page before generating a diet plan."));

        if (profile.getAge() == null || profile.getWeightKg() == null || profile.getHeightCm() == null) {
            throw new BadRequestException(
                    "Your health profile is missing age, weight, or height — fill those in on the Profile page before generating a diet plan.");
        }

        List<String> goalCodes = userHealthGoalRepository.findAllByUserIdAndActiveTrue(userId).stream()
                .map(g -> g.getGoal().getCode())
                .toList();

        NutritionTargetService.Targets targets = nutritionTargetService.compute(profile, goalCodes);
        BigDecimal calorieTarget = targets.calorieTarget();
        BigDecimal proteinTarget = targets.proteinTarget();

        // Only one plan is "current" at a time — starting a new one
        // supersedes whatever was previously active, same pattern as
        // Nutrition Twin's "regenerate" replacing the prior snapshot.
        dietPlanRepository.findFirstByUserIdAndStatusOrderByCreatedAtDesc(userId, PlanStatus.ACTIVE)
                .ifPresent(existing -> {
                    existing.setStatus(PlanStatus.ABANDONED);
                    dietPlanRepository.save(existing);
                });

        LocalDate startDate = LocalDate.now();
        LocalDate endDate = startDate.plusDays(dayCountFor(planType) - 1L);

        DietPlan plan = DietPlan.builder()
                .user(user)
                .planType(planType)
                .calorieTarget(calorieTarget)
                .proteinTarget(proteinTarget)
                .startDate(startDate)
                .endDate(endDate)
                .status(PlanStatus.ACTIVE)
                .generationStatus(ProcessingStatus.PENDING)
                .build();
        plan = dietPlanRepository.save(plan);

        AiServiceClient.HealthContext healthContext = healthContextService.build(userId);
        aiServiceClient.triggerDietPlanGeneration(plan.getId(), calorieTarget, proteinTarget, healthContext);

        plan.setGenerationStatus(ProcessingStatus.PROCESSING);
        plan = dietPlanRepository.save(plan);

        return DietPlanResponse.from(plan, List.of());
    }

    @Transactional(readOnly = true)
    public DietPlanResponse getActive(Long userId) {
        DietPlan plan = dietPlanRepository.findFirstByUserIdAndStatusOrderByCreatedAtDesc(userId, PlanStatus.ACTIVE)
                .orElseThrow(() -> new ResourceNotFoundException("No active diet plan — generate one first."));
        return toResponseWithDays(plan);
    }

    @Transactional(readOnly = true)
    public DietPlanResponse getStatus(Long userId, Long planId) {
        DietPlan plan = dietPlanRepository.findByIdAndUserId(planId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Diet plan not found."));
        return toResponseWithDays(plan);
    }

    /**
     * Called by ai-service once the 7 day templates are generated. Cycles
     * through them to fill however many days this plan's type actually
     * needs (1/7/30) — see the class doc on DietPlanGenerationResultRequest
     * for why the cycling logic lives here rather than in ai-service.
     */
    @Transactional
    public void applyGenerationResult(Long planId, boolean success, String failureReason,
                                       List<DietPlanGenerationResultRequest.DayTemplate> dayTemplates) {
        DietPlan plan = dietPlanRepository.findById(planId)
                .orElseThrow(() -> new ResourceNotFoundException("Diet plan not found: " + planId));

        if (!success || dayTemplates == null || dayTemplates.isEmpty()) {
            plan.setGenerationStatus(ProcessingStatus.FAILED);
            plan.setFailureReason(failureReason != null ? failureReason : "The AI model didn't return any meals.");
            dietPlanRepository.save(plan);
            notificationService.create(plan.getUser().getId(), NotificationType.PLAN_REMINDER,
                    "Your diet plan couldn't be generated: " + plan.getFailureReason());
            return;
        }

        int totalDays = dayCountFor(plan.getPlanType());
        for (int i = 0; i < totalDays; i++) {
            DietPlanGenerationResultRequest.DayTemplate template = dayTemplates.get(i % dayTemplates.size());

            DietPlanDay day = DietPlanDay.builder()
                    .dietPlan(plan)
                    .dayNumber((short) (i + 1))
                    .planDate(plan.getStartDate().plusDays(i))
                    .build();
            day = dietPlanDayRepository.save(day);

            for (DietPlanGenerationResultRequest.MealInput meal : template.meals()) {
                if (meal.name() == null || meal.name().isBlank()) continue;

                Map<String, Object> extraNutrients = new HashMap<>();
                extraNutrients.put("fatG", meal.fatG());
                extraNutrients.put("saturatedFatG", meal.saturatedFatG());
                extraNutrients.put("carbsG", meal.carbsG());
                extraNutrients.put("sugarG", meal.sugarG());
                extraNutrients.put("fiberG", meal.fiberG());
                extraNutrients.put("sodiumMg", meal.sodiumMg());

                DietPlanMeal mealEntity = DietPlanMeal.builder()
                        .dietPlanDay(day)
                        .mealType(meal.mealType())
                        .name(meal.name().length() > 255 ? meal.name().substring(0, 255) : meal.name())
                        .calories(meal.calories())
                        .proteinG(meal.proteinG())
                        .description(meal.description())
                        .extraNutrients(extraNutrients)
                        .build();
                dietPlanMealRepository.save(mealEntity);
            }
        }

        plan.setGenerationStatus(ProcessingStatus.COMPLETED);
        dietPlanRepository.save(plan);
        notificationService.create(plan.getUser().getId(), NotificationType.PLAN_REMINDER,
                "Your " + totalDays + "-day diet plan is ready to view.");
    }

    private DietPlanResponse toResponseWithDays(DietPlan plan) {
        List<DietPlanDayResponse> days = dietPlanDayRepository.findAllByDietPlanIdOrderByDayNumber(plan.getId()).stream()
                .map(day -> new DietPlanDayResponse(
                        day.getDayNumber(),
                        day.getPlanDate(),
                        dietPlanMealRepository.findAllByDietPlanDayIdOrderByMealType(day.getId()).stream()
                                .map(this::toMealResponse)
                                .toList()
                ))
                .toList();
        return DietPlanResponse.from(plan, days);
    }

    private DietPlanMealResponse toMealResponse(DietPlanMeal m) {
        Map<String, Object> extra = m.getExtraNutrients() != null ? m.getExtraNutrients() : Map.of();
        return new DietPlanMealResponse(
                m.getMealType(),
                m.getName(),
                m.getCalories(),
                m.getProteinG(),
                bigDecimalFrom(extra, "fatG"),
                bigDecimalFrom(extra, "saturatedFatG"),
                bigDecimalFrom(extra, "carbsG"),
                bigDecimalFrom(extra, "sugarG"),
                bigDecimalFrom(extra, "fiberG"),
                bigDecimalFrom(extra, "sodiumMg"),
                m.getDescription()
        );
    }

    /** JSONB numbers come back deserialized as Double, not BigDecimal — this
     * normalizes either shape (or a genuinely missing/null entry) safely. */
    private BigDecimal bigDecimalFrom(Map<String, Object> map, String key) {
        Object value = map.get(key);
        if (value == null) return null;
        if (value instanceof BigDecimal bd) return bd;
        if (value instanceof Number n) return BigDecimal.valueOf(n.doubleValue());
        return null;
    }

    private int dayCountFor(PlanType planType) {
        return switch (planType) {
            case ONE_DAY -> 1;
            case SEVEN_DAY -> 7;
            case THIRTY_DAY -> 30;
        };
    }
}