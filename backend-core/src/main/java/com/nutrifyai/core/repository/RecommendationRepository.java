package com.nutrifyai.core.repository;

import com.nutrifyai.core.entity.Recommendation;
import com.nutrifyai.core.entity.enums.RecommendationType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RecommendationRepository extends JpaRepository<Recommendation, Long> {
    List<Recommendation> findAllByUserIdAndRecommendationTypeOrderByCreatedAtDesc(Long userId, RecommendationType type);
    void deleteAllByUserIdAndRecommendationType(Long userId, RecommendationType type);
}
