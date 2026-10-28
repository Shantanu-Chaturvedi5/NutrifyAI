package com.nutrifyai.core.controller;

import com.nutrifyai.core.client.AiServiceClient;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Admin", description = "Maintenance actions — requires the ADMIN role")
public class AdminController {

    private final AiServiceClient aiServiceClient;

    @PostMapping("/products/recompute-alternatives")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Recompute content-based product alternatives for every product in a category")
    public ResponseEntity<AiServiceClient.RecomputeAlternativesResult> recomputeAlternatives(
            @RequestParam String category
    ) {
        return ResponseEntity.ok(aiServiceClient.recomputeAlternatives(category));
    }
}
