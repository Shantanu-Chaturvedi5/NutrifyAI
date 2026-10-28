package com.nutrifyai.core.repository;

import com.nutrifyai.core.entity.DietPlanDay;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DietPlanDayRepository extends JpaRepository<DietPlanDay, Long> {
    List<DietPlanDay> findAllByDietPlanIdOrderByDayNumber(Long dietPlanId);
}