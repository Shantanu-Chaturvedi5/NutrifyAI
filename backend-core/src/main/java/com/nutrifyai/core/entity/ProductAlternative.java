package com.nutrifyai.core.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "product_alternatives")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductAlternative {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "alternative_product_id", nullable = false)
    private Product alternativeProduct;

    @Column(name = "nutrition_similarity_pct")
    private Short nutritionSimilarityPct;

    @Column(name = "taste_similarity_pct")
    private Short tasteSimilarityPct;

    @Column(name = "health_score")
    private Short healthScore;

    @Column(nullable = false)
    @Builder.Default
    private Short rank = 1;
}
