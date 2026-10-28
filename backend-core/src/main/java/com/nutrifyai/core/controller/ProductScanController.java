package com.nutrifyai.core.controller;

import com.nutrifyai.core.dto.response.PagedResponse;
import com.nutrifyai.core.dto.response.ProductScanResponse;
import com.nutrifyai.core.security.SecurityUser;
import com.nutrifyai.core.service.ProductScanService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/product-scans")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Product Scans", description = "Scan a nutrition/ingredients label photo — OCR + LLM extraction creates a real product, which then gets a personalized suitability score like any other product")
public class ProductScanController {

    private final ProductScanService productScanService;

    @PostMapping(consumes = "multipart/form-data")
    @Operation(summary = "Upload a photo of a product's nutrition or ingredients label for analysis")
    public ResponseEntity<ProductScanResponse> upload(
            @AuthenticationPrincipal SecurityUser currentUser,
            @RequestPart("file") MultipartFile file
    ) {
        ProductScanResponse response = productScanService.upload(currentUser.getId(), file);
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(response);
    }

    @GetMapping
    @Operation(summary = "List my scans, newest first")
    public ResponseEntity<PagedResponse<ProductScanResponse>> list(
            @AuthenticationPrincipal SecurityUser currentUser,
            Pageable pageable
    ) {
        return ResponseEntity.ok(productScanService.list(currentUser.getId(), pageable));
    }

    @GetMapping("/{scanId}")
    @Operation(summary = "Poll a scan's processing status (PENDING/PROCESSING/COMPLETED/FAILED)")
    public ResponseEntity<ProductScanResponse> getStatus(
            @AuthenticationPrincipal SecurityUser currentUser,
            @PathVariable Long scanId
    ) {
        return ResponseEntity.ok(productScanService.getStatus(currentUser.getId(), scanId));
    }

    @DeleteMapping("/{scanId}")
    @Operation(summary = "Delete a scan record (does not delete any product it already created)")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal SecurityUser currentUser,
            @PathVariable Long scanId
    ) {
        productScanService.delete(currentUser.getId(), scanId);
        return ResponseEntity.noContent().build();
    }
}