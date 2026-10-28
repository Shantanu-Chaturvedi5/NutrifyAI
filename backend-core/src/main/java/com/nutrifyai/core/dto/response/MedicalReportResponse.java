package com.nutrifyai.core.dto.response;

import com.nutrifyai.core.entity.MedicalReport;
import com.nutrifyai.core.entity.enums.ProcessingStatus;
import com.nutrifyai.core.entity.enums.ReportType;

import java.time.OffsetDateTime;
import java.util.Map;

public record MedicalReportResponse(
        Long id,
        ReportType reportType,
        String originalFilename,
        ProcessingStatus processingStatus,
        String failureReason,
        String summary,
        java.util.List<String> suggestions,
        OffsetDateTime uploadedAt,
        OffsetDateTime processedAt
) {
    public static MedicalReportResponse from(MedicalReport report) {
        // report_analyzer.py stores {"rawText": ..., "llmSummary": ...,
        // "suggestions": [...]} here once analysis completes — summary was
        // already being written but never read back; suggestions are new,
        // generated against the user's health profile at analysis time.
        Map<String, Object> raw = report.getRawExtraction();
        Object rawSummary = raw == null ? null : raw.get("llmSummary");
        String summary = (rawSummary instanceof String s && !s.isBlank()) ? s : null;

        Object rawSuggestions = raw == null ? null : raw.get("suggestions");
        java.util.List<String> suggestions = rawSuggestions instanceof java.util.List<?> list
                ? list.stream().filter(String.class::isInstance).map(String.class::cast).toList()
                : java.util.List.of();

        return new MedicalReportResponse(
                report.getId(),
                report.getReportType(),
                report.getOriginalFilename(),
                report.getProcessingStatus(),
                report.getFailureReason(),
                summary,
                suggestions,
                report.getUploadedAt(),
                report.getProcessedAt()
        );
    }
}