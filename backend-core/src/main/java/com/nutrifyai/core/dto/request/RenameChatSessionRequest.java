package com.nutrifyai.core.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RenameChatSessionRequest(
        @NotBlank @Size(max = 255) String title
) {
}