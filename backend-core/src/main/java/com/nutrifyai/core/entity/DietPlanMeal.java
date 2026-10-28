package com.nutrifyai.core.entity;

import com.nutrifyai.core.entity.enums.MealType;
import io.hypersistence.utils.hibernate.type.json.JsonType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.Type;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

@Entity
@Table(name = "diet_plan_meals")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DietPlanMeal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "diet_plan_day_id", nullable = false)
    private DietPlanDay dietPlanDay;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "meal_type", nullable = false, columnDefinition = "meal_type_t")
    private MealType mealType;

    @Column(nullable = false)
    private String name;

    private BigDecimal calories;

    @Column(name = "protein_g")
    private BigDecimal proteinG;

    @Column(columnDefinition = "TEXT")
    private String description;

    // Reuses the recipe_json column (already in the schema, previously
    // unused) to hold the rest of the nutrition breakdown — fatG,
    // saturatedFatG, carbsG, sugarG, fiberG, sodiumMg — same key names as
    // ProductNutrition, so the frontend can treat a meal's nutrition the
    // same way it treats a product's.
    @Type(JsonType.class)
    @Column(name = "recipe_json", columnDefinition = "jsonb")
    @Builder.Default
    private Map<String, Object> extraNutrients = new HashMap<>();
}