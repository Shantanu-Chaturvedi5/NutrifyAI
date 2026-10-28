package com.nutrifyai.core.service;

import com.nutrifyai.core.dto.request.LogFoodRequest;
import com.nutrifyai.core.dto.response.DailyIntakeSummaryResponse;
import com.nutrifyai.core.dto.response.IntakeLogEntryResponse;
import com.nutrifyai.core.entity.DailyIntakeLog;
import com.nutrifyai.core.entity.DietPlan;
import com.nutrifyai.core.entity.HealthProfile;
import com.nutrifyai.core.entity.Product;
import com.nutrifyai.core.entity.ProductNutrition;
import com.nutrifyai.core.entity.User;
import com.nutrifyai.core.entity.enums.IntakeEntryType;
import com.nutrifyai.core.entity.enums.PlanStatus;
import com.nutrifyai.core.exception.BadRequestException;
import com.nutrifyai.core.exception.ResourceNotFoundException;
import com.nutrifyai.core.repository.DailyIntakeLogRepository;
import com.nutrifyai.core.repository.DietPlanRepository;
import com.nutrifyai.core.repository.HealthProfileRepository;
import com.nutrifyai.core.repository.ProductNutritionRepository;
import com.nutrifyai.core.repository.ProductRepository;
import com.nutrifyai.core.repository.UserHealthGoalRepository;
import com.nutrifyai.core.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class IntakeTrackingService {

    private final DailyIntakeLogRepository dailyIntakeLogRepository;
    private final DietPlanRepository dietPlanRepository;
    private final HealthProfileRepository healthProfileRepository;
    private final UserHealthGoalRepository userHealthGoalRepository;
    private final ProductRepository productRepository;
    private final ProductNutritionRepository productNutritionRepository;
    private final UserRepository userRepository;
    private final NutritionTargetService nutritionTargetService;

    @Transactional
    public DailyIntakeSummaryResponse logFood(Long userId, LogFoodRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));

        boolean hasProduct = request.productId() != null;
        boolean hasManual = request.description() != null && !request.description().isBlank() && request.calories() != null;

        if (!hasProduct && !hasManual) {
            throw new BadRequestException("Provide either a product to log, or a description with calories.");
        }

        DailyIntakeLog.DailyIntakeLogBuilder builder = DailyIntakeLog.builder()
                .user(user)
                .logDate(LocalDate.now())
                .entryType(IntakeEntryType.FOOD);

        if (hasProduct) {
            Product product = productRepository.findById(request.productId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + request.productId()));
            ProductNutrition nutrition = productNutritionRepository.findByProductId(product.getId()).orElse(null);
            BigDecimal qty = BigDecimal.valueOf(request.quantity());
            BigDecimal calories = nutrition != null && nutrition.getCalories() != null
                    ? nutrition.getCalories().multiply(qty) : null;
            BigDecimal proteinG = nutrition != null && nutrition.getProteinG() != null
                    ? nutrition.getProteinG().multiply(qty) : null;
            builder.product(product).description(product.getName()).calories(calories).proteinG(proteinG);
        } else {
            String desc = request.description().trim();
            builder.description(desc.length() > 255 ? desc.substring(0, 255) : desc)
                    .calories(request.calories())
                    .proteinG(request.proteinG());
        }

        dailyIntakeLogRepository.save(builder.build());
        return getDailySummary(userId, LocalDate.now());
    }

    @Transactional
    public DailyIntakeSummaryResponse logWater(Long userId, BigDecimal waterMl) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));

        DailyIntakeLog log = DailyIntakeLog.builder()
                .user(user)
                .logDate(LocalDate.now())
                .entryType(IntakeEntryType.WATER)
                .description("Water")
                .waterMl(waterMl)
                .build();
        dailyIntakeLogRepository.save(log);

        return getDailySummary(userId, LocalDate.now());
    }

    @Transactional
    public DailyIntakeSummaryResponse deleteEntry(Long userId, Long entryId) {
        DailyIntakeLog log = dailyIntakeLogRepository.findByIdAndUserId(entryId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Log entry not found."));
        LocalDate date = log.getLogDate();
        dailyIntakeLogRepository.delete(log);
        return getDailySummary(userId, date);
    }

    @Transactional(readOnly = true)
    public DailyIntakeSummaryResponse getDailySummary(Long userId, LocalDate date) {
        // Prefer the active diet plan's targets if the date falls within
        // it; otherwise compute the same deterministic targets directly
        // from the health profile (via the shared NutritionTargetService),
        // so this still works for a user who's never generated a plan.
        BigDecimal calorieTarget = null;
        BigDecimal proteinTarget = null;
        BigDecimal waterTarget;
        boolean fromPlan = false;

        Optional<DietPlan> activePlan = dietPlanRepository
                .findFirstByUserIdAndStatusOrderByCreatedAtDesc(userId, PlanStatus.ACTIVE)
                .filter(p -> !date.isBefore(p.getStartDate()) && !date.isAfter(p.getEndDate()));

        HealthProfile profile = healthProfileRepository.findByUserId(userId).orElse(null);

        if (activePlan.isPresent()) {
            DietPlan plan = activePlan.get();
            calorieTarget = plan.getCalorieTarget();
            proteinTarget = plan.getProteinTarget();
            fromPlan = true;
        } else if (profile != null && profile.getAge() != null && profile.getWeightKg() != null && profile.getHeightCm() != null) {
            List<String> goalCodes = userHealthGoalRepository.findAllByUserIdAndActiveTrue(userId).stream()
                    .map(g -> g.getGoal().getCode())
                    .toList();
            NutritionTargetService.Targets targets = nutritionTargetService.compute(profile, goalCodes);
            calorieTarget = targets.calorieTarget();
            proteinTarget = targets.proteinTarget();
        }

        if (profile != null && profile.getWeightKg() != null) {
            waterTarget = BigDecimal.valueOf(profile.getWeightKg().doubleValue() * 33).setScale(2, RoundingMode.HALF_UP);
        } else {
            waterTarget = nutritionTargetService.defaultWaterTargetMl();
        }

        BigDecimal consumedCalories = dailyIntakeLogRepository.sumCalories(userId, date);
        BigDecimal consumedProteinG = dailyIntakeLogRepository.sumProteinG(userId, date);
        BigDecimal consumedWaterMl = dailyIntakeLogRepository.sumWaterMl(userId, date);

        List<IntakeLogEntryResponse> entries = dailyIntakeLogRepository
                .findAllByUserIdAndLogDateOrderByLoggedAt(userId, date).stream()
                .map(l -> new IntakeLogEntryResponse(
                        l.getId(), l.getEntryType(), l.getDescription(),
                        l.getCalories(), l.getProteinG(), l.getWaterMl(), l.getLoggedAt()
                ))
                .toList();

        return new DailyIntakeSummaryResponse(
                date,
                calorieTarget,
                proteinTarget,
                waterTarget,
                consumedCalories,
                consumedProteinG,
                consumedWaterMl,
                calorieTarget != null ? calorieTarget.subtract(consumedCalories) : null,
                proteinTarget != null ? proteinTarget.subtract(consumedProteinG) : null,
                waterTarget.subtract(consumedWaterMl),
                fromPlan,
                entries
        );
    }
}