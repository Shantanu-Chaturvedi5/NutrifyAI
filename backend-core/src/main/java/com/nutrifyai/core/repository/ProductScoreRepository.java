package com.nutrifyai.core.repository;

import com.nutrifyai.core.entity.ProductScore;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ProductScoreRepository extends JpaRepository<ProductScore, Long> {
    Optional<ProductScore> findByProductIdAndUserId(Long productId, Long userId);
    Optional<ProductScore> findByProductIdAndUserIdIsNull(Long productId);
}
