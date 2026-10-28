package com.nutrifyai.core.repository;

import com.nutrifyai.core.entity.NutritionTwinSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface NutritionTwinSnapshotRepository extends JpaRepository<NutritionTwinSnapshot, Long> {
    Optional<NutritionTwinSnapshot> findFirstByUserIdOrderBySnapshotDateDesc(Long userId);
}
