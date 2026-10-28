package com.nutrifyai.core.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

public record LogWaterRequest(
        @NotNull @Positive BigDecimal waterMl
) {
}