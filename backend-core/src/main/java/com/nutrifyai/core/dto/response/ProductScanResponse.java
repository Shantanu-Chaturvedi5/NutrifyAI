package com.nutrifyai.core.dto.response;

import com.nutrifyai.core.entity.ProductScan;
import com.nutrifyai.core.entity.enums.ProcessingStatus;

import java.time.OffsetDateTime;

public record ProductScanResponse(
        Long id,
        ProcessingStatus processingStatus,
        String failureReason,
        Long productId,
        OffsetDateTime uploadedAt,
        OffsetDateTime processedAt
) {
    public static ProductScanResponse from(ProductScan scan) {
        return new ProductScanResponse(
                scan.getId(),
                scan.getProcessingStatus(),
                scan.getFailureReason(),
                scan.getProduct() != null ? scan.getProduct().getId() : null,
                scan.getUploadedAt(),
                scan.getProcessedAt()
        );
    }
}