package com.nutrifyai.core.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;

@Entity
@Table(name = "product_scores")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductScore {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    // null = generic/community score; set = personalized for this user
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "suitability_score")
    private Short suitabilityScore;

    @Column(name = "health_score")
    private Short healthScore;

    @Column(name = "nutrition_score")
    private Short nutritionScore;

    @Column(name = "risk_score")
    private Short riskScore;

    @Column(columnDefinition = "TEXT")
    private String reasoning;

    @Column(name = "recommended_daily_quantity")
    private String recommendedDailyQuantity;

    @Column(name = "max_daily_quantity")
    private String maxDailyQuantity;

    @CreationTimestamp
    @Column(name = "computed_at", nullable = false, updatable = false)
    private OffsetDateTime computedAt;
}
