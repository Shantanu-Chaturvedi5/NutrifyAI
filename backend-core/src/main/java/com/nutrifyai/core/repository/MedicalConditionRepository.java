package com.nutrifyai.core.repository;

import com.nutrifyai.core.entity.MedicalCondition;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface MedicalConditionRepository extends JpaRepository<MedicalCondition, Short> {
    Optional<MedicalCondition> findByCode(String code);
}
