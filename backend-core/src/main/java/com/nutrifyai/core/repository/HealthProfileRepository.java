package com.nutrifyai.core.repository;

import com.nutrifyai.core.entity.HealthProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface HealthProfileRepository extends JpaRepository<HealthProfile, Long> {
    Optional<HealthProfile> findByUserId(Long userId);
    boolean existsByUserId(Long userId);
}
