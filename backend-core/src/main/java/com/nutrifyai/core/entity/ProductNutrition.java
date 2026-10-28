package com.nutrifyai.core.entity;

import io.hypersistence.utils.hibernate.type.json.JsonType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Type;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

@Entity
@Table(name = "product_nutrition")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductNutrition {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false, unique = true)
    private Product product;

    @Column(name = "serving_size")
    private String servingSize;

    private BigDecimal calories;

    @Column(name = "protein_g")
    private BigDecimal proteinG;

    @Column(name = "fat_g")
    private BigDecimal fatG;

    @Column(name = "saturated_fat_g")
    private BigDecimal saturatedFatG;

    @Column(name = "carbs_g")
    private BigDecimal carbsG;

    @Column(name = "sugar_g")
    private BigDecimal sugarG;

    @Column(name = "fiber_g")
    private BigDecimal fiberG;

    @Column(name = "sodium_mg")
    private BigDecimal sodiumMg;

    @Column(name = "cholesterol_mg")
    private BigDecimal cholesterolMg;

    @Type(JsonType.class)
    @Column(name = "extra_nutrients", columnDefinition = "jsonb")
    @Builder.Default
    private Map<String, Object> extraNutrients = new HashMap<>();
}
