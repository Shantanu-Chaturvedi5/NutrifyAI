package com.nutrifyai.core.controller;

import com.nutrifyai.core.dto.request.MedicalReportUploadRequest;
import com.nutrifyai.core.dto.response.MedicalReportResponse;
import com.nutrifyai.core.dto.response.PagedResponse;
import com.nutrifyai.core.dto.response.ReportExtractedValueResponse;
import com.nutrifyai.core.security.SecurityUser;
import com.nutrifyai.core.service.MedicalReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/v1/reports")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Medical Reports", description = "Upload blood/CBC/lipid/HbA1c/thyroid/vitamin reports and poll analysis status")
public class MedicalReportController {

    private final MedicalReportService medicalReportService;

    @PostMapping(consumes = "multipart/form-data")
    @Operation(summary = "Upload a medical report file for analysis")
    public ResponseEntity<MedicalReportResponse> upload(
            @AuthenticationPrincipal SecurityUser currentUser,
            @RequestPart("file") MultipartFile file,
            @Valid @RequestPart("metadata") MedicalReportUploadRequest metadata
    ) {
        MedicalReportResponse response = medicalReportService.upload(currentUser.getId(), file, metadata.reportType());
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(response);
    }

    @GetMapping
    @Operation(summary = "List my uploaded reports, newest first")
    public ResponseEntity<PagedResponse<MedicalReportResponse>> list(
            @AuthenticationPrincipal SecurityUser currentUser,
            Pageable pageable
    ) {
        return ResponseEntity.ok(medicalReportService.list(currentUser.getId(), pageable));
    }

    @GetMapping("/{reportId}")
    @Operation(summary = "Poll a report's processing status (PENDING/PROCESSING/COMPLETED/FAILED)")
    public ResponseEntity<MedicalReportResponse> getStatus(
            @AuthenticationPrincipal SecurityUser currentUser,
            @PathVariable Long reportId
    ) {
        return ResponseEntity.ok(medicalReportService.getStatus(currentUser.getId(), reportId));
    }

    @GetMapping("/{reportId}/values")
    @Operation(summary = "Get extracted parameter values once a report is COMPLETED")
    public ResponseEntity<List<ReportExtractedValueResponse>> getExtractedValues(
            @AuthenticationPrincipal SecurityUser currentUser,
            @PathVariable Long reportId
    ) {
        return ResponseEntity.ok(medicalReportService.getExtractedValues(currentUser.getId(), reportId));
    }

    @DeleteMapping("/{reportId}")
    @Operation(summary = "Delete an uploaded report and its extracted values")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal SecurityUser currentUser,
            @PathVariable Long reportId
    ) {
        medicalReportService.delete(currentUser.getId(), reportId);
        return ResponseEntity.noContent().build();
    }
}