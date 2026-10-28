package com.nutrifyai.core.repository;

import com.nutrifyai.core.entity.UserHealthGoal;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserHealthGoalRepository extends JpaRepository<UserHealthGoal, Long> {
    List<UserHealthGoal> findAllByUserIdAndActiveTrue(Long userId);
}
