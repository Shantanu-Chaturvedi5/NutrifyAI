package com.nutrifyai.core.repository;

import com.nutrifyai.core.entity.ProductScan;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ProductScanRepository extends JpaRepository<ProductScan, Long> {
    Page<ProductScan> findAllByUserIdOrderByUploadedAtDesc(Long userId, Pageable pageable);
    Optional<ProductScan> findByIdAndUserId(Long id, Long userId);
}