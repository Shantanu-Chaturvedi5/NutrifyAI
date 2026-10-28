package com.nutrifyai.core.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record RatingRequest(
        @NotNull @Min(1) @Max(5) Short tasteRating,
        @NotNull @Min(1) @Max(5) Short healthinessRating,
        @NotNull @Min(1) @Max(5) Short digestibilityRating,
        @NotNull @Min(1) @Max(5) Short satisfactionRating
) {
}
