package com.nutrifyai.core.repository;

import com.nutrifyai.core.entity.ProductNutrition;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ProductNutritionRepository extends JpaRepository<ProductNutrition, Long> {
    Optional<ProductNutrition> findByProductId(Long productId);
}
