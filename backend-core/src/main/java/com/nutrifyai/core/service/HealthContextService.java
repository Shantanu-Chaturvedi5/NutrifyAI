package com.nutrifyai.core.service;

import com.nutrifyai.core.client.AiServiceClient;
import com.nutrifyai.core.repository.HealthProfileRepository;
import com.nutrifyai.core.repository.UserAllergyRepository;
import com.nutrifyai.core.repository.UserHealthGoalRepository;
import com.nutrifyai.core.repository.UserMedicalConditionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Builds the same {@link AiServiceClient.HealthContext} shape (conditions,
 * active goals, allergies, dietary preference) for any feature that needs
 * to personalize against a user's health profile. Originally lived only
 * inside ProductPersonalizationService — pulled out here once report
 * analysis needed the identical data, so both stay in sync by
 * construction instead of by two copies agreeing to.
 */
@Service
@RequiredArgsConstructor
public class HealthContextService {

    private final HealthProfileRepository healthProfileRepository;
    private final UserMedicalConditionRepository userMedicalConditionRepository;
    private final UserHealthGoalRepository userHealthGoalRepository;
    private final UserAllergyRepository userAllergyRepository;

    public AiServiceClient.HealthContext build(Long userId) {
        String dietaryPreference = healthProfileRepository.findByUserId(userId)
                .map(p -> p.getDietaryPreference() != null ? p.getDietaryPreference().name() : null)
                .orElse(null);

        List<String> conditionCodes = userMedicalConditionRepository.findAllByUserId(userId).stream()
                .map(umc -> umc.getCondition().getCode())
                .toList();

        List<String> goalCodes = userHealthGoalRepository.findAllByUserIdAndActiveTrue(userId).stream()
                .map(uhg -> uhg.getGoal().getCode())
                .toList();

        List<String> allergyNames = userAllergyRepository.findAllById_UserId(userId).stream()
                .map(ua -> ua.getAllergy().getName())
                .toList();

        return new AiServiceClient.HealthContext(conditionCodes, goalCodes, allergyNames, dietaryPreference);
    }
}