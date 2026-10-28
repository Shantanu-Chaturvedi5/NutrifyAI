package com.nutrifyai.core.exception;

import java.time.OffsetDateTime;
import java.util.Map;

public record ApiError(
        String code,
        String message,
        Map<String, String> details,
        OffsetDateTime timestamp
) {
    public static ApiError of(String code, String message) {
        return new ApiError(code, message, null, OffsetDateTime.now());
    }

    public static ApiError of(String code, String message, Map<String, String> details) {
        return new ApiError(code, message, details, OffsetDateTime.now());
    }
}
