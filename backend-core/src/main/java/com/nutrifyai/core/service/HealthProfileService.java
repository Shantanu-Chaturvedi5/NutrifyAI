package com.nutrifyai.core.service;

import com.nutrifyai.core.dto.request.AddAllergyRequest;
import com.nutrifyai.core.dto.request.AddHealthGoalRequest;
import com.nutrifyai.core.dto.request.AddMedicalConditionRequest;
import com.nutrifyai.core.dto.request.HealthProfileRequest;
import com.nutrifyai.core.dto.response.HealthGoalResponse;
import com.nutrifyai.core.dto.response.HealthProfileResponse;
import com.nutrifyai.core.dto.response.MedicalConditionResponse;
import com.nutrifyai.core.entity.*;
import com.nutrifyai.core.exception.DuplicateResourceException;
import com.nutrifyai.core.exception.ResourceNotFoundException;
import com.nutrifyai.core.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.nutrifyai.core.dto.response.HealthHistoryResponse;
import java.math.BigDecimal;

import java.util.List;

@Service
@RequiredArgsConstructor
public class HealthProfileService {

    private final UserRepository userRepository;
    private final HealthProfileRepository healthProfileRepository;
    private final MedicalConditionRepository medicalConditionRepository;
    private final UserMedicalConditionRepository userMedicalConditionRepository;
    private final HealthGoalRepository healthGoalRepository;
    private final UserHealthGoalRepository userHealthGoalRepository;
    private final AllergyRepository allergyRepository;
    private final UserAllergyRepository userAllergyRepository;
    private final HealthProfileHistoryRepository healthProfileHistoryRepository;

    @Transactional
    public HealthProfileResponse upsert(Long userId, HealthProfileRequest request) {
        User user = requireUser(userId);
        HealthProfile profile = healthProfileRepository.findByUserId(userId)
                .orElseGet(() -> HealthProfile.builder().user(user).build());

        boolean isNew = profile.getId() == null;
        BigDecimal oldWeight = profile.getWeightKg();
        BigDecimal oldHeight = profile.getHeightCm();

        profile.setAge(request.age());
        profile.setGender(request.gender());
        profile.setWeightKg(request.weightKg());
        profile.setHeightCm(request.heightCm());
        profile.setActivityLevel(request.activityLevel());
        profile.setDietaryPreference(request.dietaryPreference());

        profile = healthProfileRepository.save(profile);

        boolean changed = isNew
                || differs(oldWeight, request.weightKg())
                || differs(oldHeight, request.heightCm());
        if (changed && (request.weightKg() != null || request.heightCm() != null)) {
            healthProfileHistoryRepository.save(HealthProfileHistory.builder()
                    .userId(userId)
                    .weightKg(request.weightKg())
                    .heightCm(request.heightCm())
                    .build());
        }

        return buildResponse(userId, profile);
    }

    @Transactional(readOnly = true)
    public List<HealthHistoryResponse> history(Long userId) {
        return healthProfileHistoryRepository.findAllByUserIdOrderByRecordedAtAsc(userId).stream()
                .map(HealthHistoryResponse::from)
                .toList();
    }

    private static boolean differs(BigDecimal a, BigDecimal b) {
        if (a == null || b == null) return a != b;
        return a.compareTo(b) != 0;
    }

    @Transactional(readOnly = true)
    public HealthProfileResponse get(Long userId) {
        HealthProfile profile = healthProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No health profile yet — create one with PUT /api/v1/health-profile."));
        return buildResponse(userId, profile);
    }

    @Transactional
    public HealthProfileResponse addCondition(Long userId, AddMedicalConditionRequest request) {
        requireUser(userId);
        MedicalCondition condition = medicalConditionRepository.findByCode(request.conditionCode())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Unknown condition code: " + request.conditionCode()));

        UserMedicalCondition umc = UserMedicalCondition.builder()
                .user(userRepository.getReferenceById(userId))
                .condition(condition)
                .severity(request.severity())
                .notes(request.notes())
                .diagnosedAt(request.diagnosedAt())
                .build();

        try {
            userMedicalConditionRepository.save(umc);
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            throw new DuplicateResourceException("This condition is already on your profile.");
        }

        return get(userId);
    }

    @Transactional
    public void removeCondition(Long userId, Short conditionId) {
        userMedicalConditionRepository.deleteByUserIdAndConditionId(userId, conditionId);
    }

    @Transactional
    public HealthProfileResponse addGoal(Long userId, AddHealthGoalRequest request) {
        requireUser(userId);
        HealthGoal goal = healthGoalRepository.findByCode(request.goalCode())
                .orElseThrow(() -> new ResourceNotFoundException("Unknown goal code: " + request.goalCode()));

        UserHealthGoal uhg = UserHealthGoal.builder()
                .user(userRepository.getReferenceById(userId))
                .goal(goal)
                .targetValue(request.targetValue())
                .targetDate(request.targetDate())
                .active(true)
                .build();

        try {
            userHealthGoalRepository.save(uhg);
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            throw new DuplicateResourceException("This goal is already on your profile.");
        }

        return get(userId);
    }

    @Transactional
    public HealthProfileResponse addAllergy(Long userId, AddAllergyRequest request) {
        requireUser(userId);
        Allergy allergy = allergyRepository.findAll().stream()
                .filter(a -> a.getName().equalsIgnoreCase(request.allergyName()))
                .findFirst()
                .orElseGet(() -> {
                    Allergy a = new Allergy();
                    a.setName(request.allergyName());
                    return allergyRepository.save(a);
                });

        UserAllergy.UserAllergyId id = new UserAllergy.UserAllergyId(userId, allergy.getId());
        if (userAllergyRepository.existsById(id)) {
            throw new DuplicateResourceException("This allergy is already on your profile.");
        }

        UserAllergy userAllergy = new UserAllergy();
        userAllergy.setId(id);
        userAllergy.setUser(userRepository.getReferenceById(userId));
        userAllergy.setAllergy(allergy);
        userAllergyRepository.save(userAllergy);

        return get(userId);
    }

        // ---- remove / edit conditions, goals, allergies (keyed by code / name) ----

    @Transactional
    public HealthProfileResponse removeConditionByCode(Long userId, String code) {
        UserMedicalCondition umc = findCondition(userId, code);
        userMedicalConditionRepository.delete(umc);
        userMedicalConditionRepository.flush();
        return get(userId);
    }

    @Transactional
    public HealthProfileResponse updateCondition(Long userId, String code, AddMedicalConditionRequest request) {
        UserMedicalCondition old = findCondition(userId, code);
        userMedicalConditionRepository.delete(old);
        userMedicalConditionRepository.flush();
        userMedicalConditionRepository.save(UserMedicalCondition.builder()
                .user(userRepository.getReferenceById(userId))
                .condition(old.getCondition())
                .severity(request.severity())
                .notes(request.notes())
                .diagnosedAt(request.diagnosedAt() != null ? request.diagnosedAt() : old.getDiagnosedAt())
                .build());
        return get(userId);
    }

    @Transactional
    public HealthProfileResponse removeGoalByCode(Long userId, String code) {
        UserHealthGoal goal = findGoal(userId, code);
        userHealthGoalRepository.delete(goal);
        userHealthGoalRepository.flush();
        return get(userId);
    }

    @Transactional
    public HealthProfileResponse updateGoal(Long userId, String code, AddHealthGoalRequest request) {
        UserHealthGoal old = findGoal(userId, code);
        userHealthGoalRepository.delete(old);
        userHealthGoalRepository.flush();
        userHealthGoalRepository.save(UserHealthGoal.builder()
                .user(userRepository.getReferenceById(userId))
                .goal(old.getGoal())
                .targetValue(request.targetValue())
                .targetDate(request.targetDate())
                .active(true)
                .build());
        return get(userId);
    }

    @Transactional
    public HealthProfileResponse removeAllergyByName(Long userId, String name) {
        UserAllergy ua = findAllergy(userId, name);
        userAllergyRepository.delete(ua);
        userAllergyRepository.flush();
        return get(userId);
    }

    /** If the new name is already on the profile, addAllergy throws and the whole change rolls back. */
    @Transactional
    public HealthProfileResponse renameAllergy(Long userId, String oldName, AddAllergyRequest request) {
        UserAllergy old = findAllergy(userId, oldName);
        userAllergyRepository.delete(old);
        userAllergyRepository.flush();
        return addAllergy(userId, request);
    }

    private UserMedicalCondition findCondition(Long userId, String code) {
        return userMedicalConditionRepository.findAllByUserId(userId).stream()
                .filter(c -> c.getCondition().getCode().equals(code))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("That condition is not on your profile."));
    }

    private UserHealthGoal findGoal(Long userId, String code) {
        return userHealthGoalRepository.findAllByUserIdAndActiveTrue(userId).stream()
                .filter(g -> g.getGoal().getCode().equals(code))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("That goal is not on your profile."));
    }

    private UserAllergy findAllergy(Long userId, String name) {
        return userAllergyRepository.findAllById_UserId(userId).stream()
                .filter(a -> a.getAllergy().getName().equalsIgnoreCase(name))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("That allergy is not on your profile."));
    }
    private HealthProfileResponse buildResponse(Long userId, HealthProfile profile) {
        List<MedicalConditionResponse> conditions = userMedicalConditionRepository.findAllByUserId(userId).stream()
                .map(MedicalConditionResponse::from)
                .toList();

        List<HealthGoalResponse> goals = userHealthGoalRepository.findAllByUserIdAndActiveTrue(userId).stream()
                .map(HealthGoalResponse::from)
                .toList();

        List<String> allergies = userAllergyRepository.findAllById_UserId(userId).stream()
                .map(ua -> ua.getAllergy().getName())
                .toList();

        return HealthProfileResponse.from(profile, conditions, goals, allergies);
    }

    private User requireUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));
    }
}
