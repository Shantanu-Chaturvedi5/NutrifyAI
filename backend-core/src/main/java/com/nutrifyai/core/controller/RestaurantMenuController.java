package com.nutrifyai.core.controller;

import com.nutrifyai.core.dto.response.PagedResponse;
import com.nutrifyai.core.dto.response.RestaurantMenuResponse;
import com.nutrifyai.core.security.SecurityUser;
import com.nutrifyai.core.service.RestaurantMenuService;
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
@RequestMapping("/api/v1/restaurant-menus")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Restaurant Menus", description = "Scan a restaurant menu photo — OCR + LLM extraction estimates each item's nutrition and flags which ones suit you")
public class RestaurantMenuController {

    private final RestaurantMenuService restaurantMenuService;

    @PostMapping(consumes = "multipart/form-data")
    @Operation(summary = "Upload a photo of a restaurant menu for analysis")
    public ResponseEntity<RestaurantMenuResponse> upload(
            @AuthenticationPrincipal SecurityUser currentUser,
            @RequestPart("file") MultipartFile file
    ) {
        RestaurantMenuResponse response = restaurantMenuService.upload(currentUser.getId(), file);
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(response);
    }

    @GetMapping
    @Operation(summary = "List my scanned menus, newest first")
    public ResponseEntity<PagedResponse<RestaurantMenuResponse>> list(
            @AuthenticationPrincipal SecurityUser currentUser,
            Pageable pageable
    ) {
        return ResponseEntity.ok(restaurantMenuService.list(currentUser.getId(), pageable));
    }

    @GetMapping("/{menuId}")
    @Operation(summary = "Poll a menu's processing status, or view its analyzed items once ready")
    public ResponseEntity<RestaurantMenuResponse> getStatus(
            @AuthenticationPrincipal SecurityUser currentUser,
            @PathVariable Long menuId
    ) {
        return ResponseEntity.ok(restaurantMenuService.getStatus(currentUser.getId(), menuId));
    }

    @DeleteMapping("/{menuId}")
    @Operation(summary = "Delete a scanned menu")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal SecurityUser currentUser,
            @PathVariable Long menuId
    ) {
        restaurantMenuService.delete(currentUser.getId(), menuId);
        return ResponseEntity.noContent().build();
    }
}