package com.nutrifyai.core.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "grocery_cart_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GroceryCartItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cart_id", nullable = false)
    private GroceryCart cart;

    // Nullable — an item can be a real catalog product (linked, so its
    // name/image can be shown) or just free text the user typed with
    // nothing behind it.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id")
    private Product product;

    @Column(name = "raw_item_name", nullable = false)
    private String rawItemName;

    @Column(nullable = false)
    @Builder.Default
    private Short quantity = 1;

    // e.g. "pack", "kg", "g", "L", "ml", "dozen" — set once at add time,
    // not editable afterward (remove and re-add to change it) to keep the
    // UI simple.
    @Column(nullable = false)
    @Builder.Default
    private String unit = "pack";
}