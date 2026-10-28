package com.nutrifyai.core.entity;

import com.nutrifyai.core.entity.enums.ProcessingStatus;
import com.nutrifyai.core.entity.enums.ReportType;
import io.hypersistence.utils.hibernate.type.json.JsonType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.Type;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.Map;

@Entity
@Table(name = "medical_reports")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MedicalReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "report_type", nullable = false, columnDefinition = "report_type_t")
    private ReportType reportType;

    @Column(name = "original_filename", nullable = false)
    private String originalFilename;

    @Column(name = "file_url", nullable = false, columnDefinition = "TEXT")
    private String fileUrl;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "processing_status", nullable = false, columnDefinition = "processing_status_t")
    @Builder.Default
    private ProcessingStatus processingStatus = ProcessingStatus.PENDING;

    // Full OCR text, bounding boxes, LLM summary — written by the AI service
    // once Phase 4 wires the callback. Empty map until then.
    @Type(JsonType.class)
    @Column(name = "raw_extraction", columnDefinition = "jsonb")
    @Builder.Default
    private Map<String, Object> rawExtraction = new HashMap<>();

    @Column(name = "failure_reason", columnDefinition = "TEXT")
    private String failureReason;

    @CreationTimestamp
    @Column(name = "uploaded_at", nullable = false, updatable = false)
    private OffsetDateTime uploadedAt;

    @Column(name = "processed_at")
    private OffsetDateTime processedAt;
}
