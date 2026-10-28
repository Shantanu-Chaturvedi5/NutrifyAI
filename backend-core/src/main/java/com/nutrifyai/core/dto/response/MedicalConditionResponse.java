package com.nutrifyai.core.dto.response;

import com.nutrifyai.core.entity.UserMedicalCondition;

import java.time.LocalDate;

public record MedicalConditionResponse(
        String code,
        String name,
        String severity,
        String notes,
        LocalDate diagnosedAt
) {
    public static MedicalConditionResponse from(UserMedicalCondition umc) {
        return new MedicalConditionResponse(
                umc.getCondition().getCode(),
                umc.getCondition().getName(),
                umc.getSeverity(),
                umc.getNotes(),
                umc.getDiagnosedAt()
        );
    }
}
