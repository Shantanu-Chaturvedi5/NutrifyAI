package com.nutrifyai.core.repository;

import com.nutrifyai.core.entity.HealthProfileHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface HealthProfileHistoryRepository extends JpaRepository<HealthProfileHistory, Long> {
    List<HealthProfileHistory> findAllByUserIdOrderByRecordedAtAsc(Long userId);
}