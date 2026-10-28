package com.nutrifyai.core.repository;

import com.nutrifyai.core.entity.Rating;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface RatingRepository extends JpaRepository<Rating, Long> {
    Optional<Rating> findByProductIdAndUserId(Long productId, Long userId);
    List<Rating> findAllByProductId(Long productId);

    @Query("SELECT AVG(r.healthinessRating) FROM Rating r WHERE r.product.id = :productId")
    Double averageHealthinessRating(@Param("productId") Long productId);
}
