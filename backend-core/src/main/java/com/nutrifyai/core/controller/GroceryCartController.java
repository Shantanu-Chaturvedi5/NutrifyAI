package com.nutrifyai.core.controller;

import com.nutrifyai.core.dto.request.AddGroceryItemRequest;
import com.nutrifyai.core.dto.request.UpdateGroceryItemQuantityRequest;
import com.nutrifyai.core.dto.response.GroceryCartResponse;
import com.nutrifyai.core.security.SecurityUser;
import com.nutrifyai.core.service.GroceryCartService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/grocery-cart")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Grocery Cart", description = "A running shopping list — items can be linked to a real catalog product or just free text")
public class GroceryCartController {

    private final GroceryCartService groceryCartService;

    @GetMapping
    @Operation(summary = "Get my current grocery list")
    public ResponseEntity<GroceryCartResponse> getCurrent(@AuthenticationPrincipal SecurityUser currentUser) {
        return ResponseEntity.ok(groceryCartService.getCurrent(currentUser.getId()));
    }

    @PostMapping("/items")
    @Operation(summary = "Add an item — either a real product (productId) or free text (rawItemName)")
    public ResponseEntity<GroceryCartResponse> addItem(
            @AuthenticationPrincipal SecurityUser currentUser,
            @Valid @RequestBody AddGroceryItemRequest request
    ) {
        return ResponseEntity.ok(groceryCartService.addItem(currentUser.getId(), request));
    }

    @PatchMapping("/items/{itemId}")
    @Operation(summary = "Update an item's quantity")
    public ResponseEntity<GroceryCartResponse> updateQuantity(
            @AuthenticationPrincipal SecurityUser currentUser,
            @PathVariable Long itemId,
            @Valid @RequestBody UpdateGroceryItemQuantityRequest request
    ) {
        return ResponseEntity.ok(groceryCartService.updateQuantity(currentUser.getId(), itemId, request.quantity()));
    }

    @DeleteMapping("/items/{itemId}")
    @Operation(summary = "Remove an item from the list")
    public ResponseEntity<GroceryCartResponse> removeItem(
            @AuthenticationPrincipal SecurityUser currentUser,
            @PathVariable Long itemId
    ) {
        return ResponseEntity.ok(groceryCartService.removeItem(currentUser.getId(), itemId));
    }

    @PostMapping("/clear")
    @Operation(summary = "Remove all items from the current list")
    public ResponseEntity<GroceryCartResponse> clearList(@AuthenticationPrincipal SecurityUser currentUser) {
        return ResponseEntity.ok(groceryCartService.clearList(currentUser.getId()));
    }
}