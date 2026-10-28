package com.nutrifyai.core.service;

import com.nutrifyai.core.client.AiServiceClient;
import com.nutrifyai.core.dto.response.MedicalReportResponse;
import com.nutrifyai.core.dto.response.PagedResponse;
import com.nutrifyai.core.dto.response.ReportExtractedValueResponse;
import com.nutrifyai.core.entity.MedicalReport;
import com.nutrifyai.core.entity.ReportExtractedValue;
import com.nutrifyai.core.entity.User;
import com.nutrifyai.core.entity.enums.NotificationType;
import com.nutrifyai.core.entity.enums.ProcessingStatus;
import com.nutrifyai.core.entity.enums.ReportType;
import com.nutrifyai.core.entity.enums.ValueStatus;
import com.nutrifyai.core.exception.ResourceNotFoundException;
import com.nutrifyai.core.repository.MedicalReportRepository;
import com.nutrifyai.core.repository.ReportExtractedValueRepository;
import com.nutrifyai.core.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class MedicalReportService {

    private final MedicalReportRepository medicalReportRepository;
    private final ReportExtractedValueRepository reportExtractedValueRepository;
    private final UserRepository userRepository;
    private final S3Service s3Service;
    private final AiServiceClient aiServiceClient;
    private final HealthContextService healthContextService;
    private final NotificationService notificationService;

    @Transactional
    public MedicalReportResponse upload(Long userId, MultipartFile file, ReportType reportType) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));

        String s3Key = s3Service.upload(file, "medical-reports");

        MedicalReport report = MedicalReport.builder()
                .user(user)
                .reportType(reportType)
                .originalFilename(file.getOriginalFilename())
                .fileUrl(s3Key)
                .processingStatus(ProcessingStatus.PENDING)
                .build();

        report = medicalReportRepository.save(report);

        // Async — doesn't block this response. See AiServiceClient for why
        // a failure here is logged, not thrown. Health context lets the
        // analysis suggest things specific to this user's conditions,
        // goals, allergies, and diet — not just generic lab-value ranges.
        aiServiceClient.triggerReportAnalysis(
                report.getId(), s3Key, reportType.name(), healthContextService.build(userId));
        report.setProcessingStatus(ProcessingStatus.PROCESSING);
        report = medicalReportRepository.save(report);

        return MedicalReportResponse.from(report);
    }

    @Transactional(readOnly = true)
    public PagedResponse<MedicalReportResponse> list(Long userId, Pageable pageable) {
        return PagedResponse.from(
                medicalReportRepository.findAllByUserIdOrderByUploadedAtDesc(userId, pageable)
                        .map(MedicalReportResponse::from)
        );
    }

    @Transactional(readOnly = true)
    public MedicalReportResponse getStatus(Long userId, Long reportId) {
        MedicalReport report = requireOwnedReport(userId, reportId);
        return MedicalReportResponse.from(report);
    }

    @Transactional(readOnly = true)
    public List<ReportExtractedValueResponse> getExtractedValues(Long userId, Long reportId) {
        requireOwnedReport(userId, reportId);
        return reportExtractedValueRepository.findAllByReportId(reportId).stream()
                .map(ReportExtractedValueResponse::from)
                .toList();
    }

    /**
     * Called by the AI service (Phase 4) once OCR + analysis finishes.
     * Validated at the controller layer via the internal service token,
     * not user auth — this is service-to-service.
     */
    @Transactional
    public void applyAnalysisResult(
            Long reportId,
            boolean success,
            String failureReason,
            Map<String, Object> rawExtraction,
            List<ExtractedValueInput> extractedValues
    ) {
        MedicalReport report = medicalReportRepository.findById(reportId)
                .orElseThrow(() -> new ResourceNotFoundException("Report not found: " + reportId));

        if (!success) {
            report.setProcessingStatus(ProcessingStatus.FAILED);
            report.setFailureReason(failureReason);
            report.setProcessedAt(OffsetDateTime.now());
            medicalReportRepository.save(report);
            notificationService.create(report.getUser().getId(), NotificationType.REPORT_READY,
                    "Analysis of \"" + report.getOriginalFilename() + "\" failed: " + failureReason);
            return;
        }

        report.setProcessingStatus(ProcessingStatus.COMPLETED);
        report.setRawExtraction(rawExtraction);
        report.setProcessedAt(OffsetDateTime.now());
        medicalReportRepository.save(report);
        notificationService.create(report.getUser().getId(), NotificationType.REPORT_READY,
                "Your report \"" + report.getOriginalFilename() + "\" has been analyzed and is ready to view.");

        boolean hasDeficiency = extractedValues.stream()
                .anyMatch(v -> v.status() == ValueStatus.DEFICIENT || v.status() == ValueStatus.CRITICAL);
        if (hasDeficiency) {
            notificationService.create(report.getUser().getId(), NotificationType.DEFICIENCY_ALERT,
                    "\"" + report.getOriginalFilename() + "\" flagged one or more values outside the normal range — worth a look.");
        }

        for (ExtractedValueInput input : extractedValues) {
            ReportExtractedValue value = ReportExtractedValue.builder()
                    .report(report)
                    .parameterName(input.parameterName())
                    .value(input.value())
                    .unit(input.unit())
                    .referenceRangeLow(input.referenceRangeLow())
                    .referenceRangeHigh(input.referenceRangeHigh())
                    .status(input.status())
                    .build();
            reportExtractedValueRepository.save(value);
        }
    }

    /**
     * DB delete cascades to report_extracted_values at the schema level
     * (ON DELETE CASCADE) — only the stored file needs cleaning up here,
     * and that's best-effort so a storage hiccup never blocks the delete.
     */
    @Transactional
    public void delete(Long userId, Long reportId) {
        MedicalReport report = requireOwnedReport(userId, reportId);
        s3Service.delete(report.getFileUrl());
        medicalReportRepository.delete(report);
    }

    private MedicalReport requireOwnedReport(Long userId, Long reportId) {
        return medicalReportRepository.findByIdAndUserId(reportId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Report not found."));
    }

    public record ExtractedValueInput(
            String parameterName,
            java.math.BigDecimal value,
            String unit,
            java.math.BigDecimal referenceRangeLow,
            java.math.BigDecimal referenceRangeHigh,
            com.nutrifyai.core.entity.enums.ValueStatus status
    ) {
    }
}