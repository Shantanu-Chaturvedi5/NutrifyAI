package com.nutrifyai.core.dto.response;

import com.nutrifyai.core.entity.enums.IntakeEntryType;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record IntakeLogEntryResponse(
        Long id,
        IntakeEntryType entryType,
        String description,
        BigDecimal calories,
        BigDecimal proteinG,
        BigDecimal waterMl,
        OffsetDateTime loggedAt
) {
}