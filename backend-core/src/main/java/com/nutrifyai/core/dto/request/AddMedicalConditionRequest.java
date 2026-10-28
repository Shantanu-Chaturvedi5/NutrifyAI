package com.nutrifyai.core.dto.request;

import jakarta.validation.constraints.NotBlank;

import java.time.LocalDate;

public record AddMedicalConditionRequest(
        @NotBlank String conditionCode,   // e.g. "DIABETES" — see medical_conditions seed data
        String severity,
        String notes,
        LocalDate diagnosedAt
) {
}
