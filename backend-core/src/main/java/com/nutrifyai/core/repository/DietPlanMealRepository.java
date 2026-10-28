package com.nutrifyai.core.repository;

import com.nutrifyai.core.entity.DietPlanMeal;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DietPlanMealRepository extends JpaRepository<DietPlanMeal, Long> {
    List<DietPlanMeal> findAllByDietPlanDayIdOrderByMealType(Long dietPlanDayId);
}