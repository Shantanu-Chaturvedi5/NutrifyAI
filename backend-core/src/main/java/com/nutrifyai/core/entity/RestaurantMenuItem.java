package com.nutrifyai.core.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "restaurant_menu_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RestaurantMenuItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "menu_id", nullable = false)
    private RestaurantMenu menu;

    @Column(name = "item_name", nullable = false)
    private String itemName;

    @Column(name = "estimated_calories")
    private BigDecimal estimatedCalories;

    @Column(name = "estimated_protein_g")
    private BigDecimal estimatedProteinG;

    @Column(name = "is_recommended", nullable = false)
    @Builder.Default
    private boolean isRecommended = false;

    @Column(name = "recommendation_reason", columnDefinition = "TEXT")
    private String recommendationReason;
}