package com.nutrifyai.core.repository;

import com.nutrifyai.core.entity.UserMedicalCondition;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserMedicalConditionRepository extends JpaRepository<UserMedicalCondition, Long> {
    List<UserMedicalCondition> findAllByUserId(Long userId);
    void deleteByUserIdAndConditionId(Long userId, Short conditionId);
}
