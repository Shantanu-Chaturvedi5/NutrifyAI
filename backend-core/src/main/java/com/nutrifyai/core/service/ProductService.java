package com.nutrifyai.core.service;

import com.nutrifyai.core.dto.response.PagedResponse;
import com.nutrifyai.core.dto.response.ProductAlternativeResponse;
import com.nutrifyai.core.dto.response.ProductNutritionResponse;
import com.nutrifyai.core.dto.response.ProductResponse;
import com.nutrifyai.core.entity.Product;
import com.nutrifyai.core.entity.ProductAlternative;
import com.nutrifyai.core.exception.ResourceNotFoundException;
import com.nutrifyai.core.repository.ProductAlternativeRepository;
import com.nutrifyai.core.repository.ProductNutritionRepository;
import com.nutrifyai.core.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final ProductNutritionRepository productNutritionRepository;
    private final ProductAlternativeRepository productAlternativeRepository;

    @Transactional(readOnly = true)
    public ProductResponse getById(Long productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found."));
        return toResponse(product);
    }

    @Transactional(readOnly = true)
    public ProductResponse getByBarcode(String barcode) {
        Product product = productRepository.findByBarcode(barcode)
                .orElseThrow(() -> new ResourceNotFoundException("No product found for barcode " + barcode));
        return toResponse(product);
    }

    @Transactional(readOnly = true)
    public PagedResponse<ProductResponse> search(String query, Pageable pageable) {
        return PagedResponse.from(productRepository.searchByName(query, pageable).map(this::toResponse));
    }

    @Transactional(readOnly = true)
    public PagedResponse<ProductResponse> listByCategory(String category, Pageable pageable) {
        // Powers the Products page's default browse view (no filter selected)
        // as well as category-filtered browsing — one endpoint, category
        // param optional, rather than a separate "list everything" route.
        Page<Product> page = (category == null || category.isBlank())
                ? productRepository.findAll(pageable)
                : productRepository.findAllByCategoryIgnoreCase(category, pageable);
        return PagedResponse.from(page.map(this::toResponse));
    }

    @Transactional(readOnly = true)
    public List<String> listCategories() {
        return productRepository.findDistinctCategories();
    }

    /**
     * Reads whatever the ai-service's content-based recommendation engine
     * last computed (see ai-service/app/ml/content_based.py). Returns an
     * empty list if recompute hasn't run for this product's category yet
     * — not an error, just nothing to show.
     */
    @Transactional(readOnly = true)
    public List<ProductAlternativeResponse> getAlternatives(Long productId) {
        return productAlternativeRepository.findAllByProductIdOrderByRank(productId).stream()
                .map(this::toAlternativeResponse)
                .toList();
    }

    private ProductAlternativeResponse toAlternativeResponse(ProductAlternative alt) {
        Product alternative = alt.getAlternativeProduct();
        return new ProductAlternativeResponse(
                alternative.getId(),
                alternative.getName(),
                alternative.getBrand(),
                alternative.getImageUrl(),
                alt.getNutritionSimilarityPct(),
                alt.getTasteSimilarityPct(),
                alt.getHealthScore(),
                alt.getRank()
        );
    }

    private ProductResponse toResponse(Product product) {
        ProductNutritionResponse nutrition = productNutritionRepository.findByProductId(product.getId())
                .map(ProductNutritionResponse::from)
                .orElse(null);
        return ProductResponse.from(product, nutrition);
    }
}