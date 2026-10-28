package com.nutrifyai.core.repository;

import com.nutrifyai.core.entity.ReportExtractedValue;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReportExtractedValueRepository extends JpaRepository<ReportExtractedValue, Long> {
    List<ReportExtractedValue> findAllByReportId(Long reportId);
}
