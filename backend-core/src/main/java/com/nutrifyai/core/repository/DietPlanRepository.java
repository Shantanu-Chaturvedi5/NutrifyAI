package com.nutrifyai.core.repository;

import com.nutrifyai.core.entity.DietPlan;
import com.nutrifyai.core.entity.enums.PlanStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DietPlanRepository extends JpaRepository<DietPlan, Long> {
    Optional<DietPlan> findFirstByUserIdAndStatusOrderByCreatedAtDesc(Long userId, PlanStatus status);
    List<DietPlan> findAllByUserIdAndStatus(Long userId, PlanStatus status);
    Optional<DietPlan> findByIdAndUserId(Long id, Long userId);
}