package com.nutrifyai.core.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record UpdateGroceryItemQuantityRequest(
        @NotNull @Min(1) Short quantity
) {
}