package com.nutrifyai.core.dto.request;

import jakarta.validation.constraints.NotBlank;

public record AddAllergyRequest(
        @NotBlank String allergyName
) {
}
