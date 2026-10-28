package com.nutrifyai.core.repository;

import com.nutrifyai.core.entity.DailyIntakeLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface DailyIntakeLogRepository extends JpaRepository<DailyIntakeLog, Long> {
    List<DailyIntakeLog> findAllByUserIdAndLogDateOrderByLoggedAt(Long userId, LocalDate logDate);
    Optional<DailyIntakeLog> findByIdAndUserId(Long id, Long userId);

    @Query("SELECT COALESCE(SUM(l.calories), 0) FROM DailyIntakeLog l WHERE l.user.id = :userId AND l.logDate = :logDate AND l.entryType = 'FOOD'")
    java.math.BigDecimal sumCalories(@Param("userId") Long userId, @Param("logDate") LocalDate logDate);

    @Query("SELECT COALESCE(SUM(l.proteinG), 0) FROM DailyIntakeLog l WHERE l.user.id = :userId AND l.logDate = :logDate AND l.entryType = 'FOOD'")
    java.math.BigDecimal sumProteinG(@Param("userId") Long userId, @Param("logDate") LocalDate logDate);

    @Query("SELECT COALESCE(SUM(l.waterMl), 0) FROM DailyIntakeLog l WHERE l.user.id = :userId AND l.logDate = :logDate AND l.entryType = 'WATER'")
    java.math.BigDecimal sumWaterMl(@Param("userId") Long userId, @Param("logDate") LocalDate logDate);
}