package com.nutrifyai.core.dto.request;

import com.nutrifyai.core.entity.enums.ReportType;
import jakarta.validation.constraints.NotNull;

/**
 * The file itself arrives as a multipart part (bound directly in the
 * controller via MultipartFile) — this just carries the metadata that
 * comes alongside it as form fields.
 */
public record MedicalReportUploadRequest(
        @NotNull ReportType reportType
) {
}
