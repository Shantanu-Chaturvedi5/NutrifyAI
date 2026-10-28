package com.nutrifyai.core.repository;

import com.nutrifyai.core.entity.HealthGoal;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface HealthGoalRepository extends JpaRepository<HealthGoal, Short> {
    Optional<HealthGoal> findByCode(String code);
}
