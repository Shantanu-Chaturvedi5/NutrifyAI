package com.nutrifyai.core.dto.response;

import com.nutrifyai.core.entity.Product;
import com.nutrifyai.core.entity.enums.ProductSource;

import java.time.OffsetDateTime;

public record ProductResponse(
        Long id,
        String barcode,
        String name,
        String brand,
        String category,
        String imageUrl,
        String description,
        ProductSource source,
        ProductNutritionResponse nutrition,
        OffsetDateTime createdAt
) {
    public static ProductResponse from(Product product, ProductNutritionResponse nutrition) {
        return new ProductResponse(
                product.getId(),
                product.getBarcode(),
                product.getName(),
                product.getBrand(),
                product.getCategory(),
                product.getImageUrl(),
                product.getDescription(),
                product.getSource(),
                nutrition,
                product.getCreatedAt()
        );
    }
}
