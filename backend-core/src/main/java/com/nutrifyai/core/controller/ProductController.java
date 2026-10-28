package com.nutrifyai.core.controller;

import com.nutrifyai.core.dto.response.PagedResponse;
import com.nutrifyai.core.dto.response.ProductAlternativeResponse;
import com.nutrifyai.core.dto.response.ProductResponse;
import com.nutrifyai.core.dto.response.ProductScoreResponse;
import com.nutrifyai.core.security.SecurityUser;
import com.nutrifyai.core.service.ProductPersonalizationService;
import com.nutrifyai.core.service.ProductService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/products")
@RequiredArgsConstructor
@Tag(name = "Products", description = "Product catalog — public read access, no auth required")
public class ProductController {

    private final ProductService productService;
    private final ProductPersonalizationService productPersonalizationService;

    @GetMapping("/{id}")
    @Operation(summary = "Get a product by id, including its nutrition facts")
    public ResponseEntity<ProductResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(productService.getById(id));
    }

    @GetMapping("/barcode/{barcode}")
    @Operation(summary = "Look up a product by scanned barcode")
    public ResponseEntity<ProductResponse> getByBarcode(@PathVariable String barcode) {
        return ResponseEntity.ok(productService.getByBarcode(barcode));
    }

    @GetMapping("/search")
    @Operation(summary = "Fuzzy search products by name (pg_trgm)")
    public ResponseEntity<PagedResponse<ProductResponse>> search(
            @RequestParam String q,
            Pageable pageable
    ) {
        return ResponseEntity.ok(productService.search(q, pageable));
    }

    @GetMapping
    @Operation(summary = "List products, optionally filtered by category (omit for the default browse view)")
    public ResponseEntity<PagedResponse<ProductResponse>> listByCategory(
            @RequestParam(required = false) String category,
            Pageable pageable
    ) {
        return ResponseEntity.ok(productService.listByCategory(category, pageable));
    }

    @GetMapping("/categories")
    @Operation(summary = "List every distinct category currently in the catalog, for filter UI")
    public ResponseEntity<List<String>> listCategories() {
        return ResponseEntity.ok(productService.listCategories());
    }

    @GetMapping("/{id}/alternatives")
    @Operation(summary = "Get recommended alternatives for a product (content-based: nutrition + ingredient similarity)")
    public ResponseEntity<List<ProductAlternativeResponse>> getAlternatives(@PathVariable Long id) {
        return ResponseEntity.ok(productService.getAlternatives(id));
    }

    @GetMapping("/{id}/personalized-score")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Get this product's suitability/health/nutrition/risk scores personalized to my health profile")
    public ResponseEntity<ProductScoreResponse> getPersonalizedScore(
            @AuthenticationPrincipal SecurityUser currentUser,
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(productPersonalizationService.getPersonalizedScore(currentUser.getId(), id));
    }
}