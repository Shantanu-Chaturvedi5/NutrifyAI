package com.nutrifyai.core.repository;

import com.nutrifyai.core.entity.ProductIngredient;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProductIngredientRepository extends JpaRepository<ProductIngredient, Long> {
    List<ProductIngredient> findAllByProductIdOrderByPosition(Long productId);
}
