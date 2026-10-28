package com.nutrifyai.core.entity;

import io.hypersistence.utils.hibernate.type.json.JsonType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.Type;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.Map;

@Entity
@Table(name = "nutrition_twin_snapshots", uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "snapshot_date"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NutritionTwinSnapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "snapshot_date", nullable = false)
    private LocalDate snapshotDate;

    @Column(name = "health_trend_summary", columnDefinition = "TEXT")
    private String healthTrendSummary;

    @Column(name = "deficiency_trend_summary", columnDefinition = "TEXT")
    private String deficiencyTrendSummary;

    @Column(name = "risk_prediction_summary", columnDefinition = "TEXT")
    private String riskPredictionSummary;

    @Type(JsonType.class)
    @Column(name = "detail_json", columnDefinition = "jsonb")
    @Builder.Default
    private Map<String, Object> detailJson = new HashMap<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;
}
