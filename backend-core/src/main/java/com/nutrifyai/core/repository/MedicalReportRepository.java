package com.nutrifyai.core.repository;

import com.nutrifyai.core.entity.MedicalReport;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface MedicalReportRepository extends JpaRepository<MedicalReport, Long> {
    Page<MedicalReport> findAllByUserIdOrderByUploadedAtDesc(Long userId, Pageable pageable);
    Optional<MedicalReport> findByIdAndUserId(Long id, Long userId);
}
