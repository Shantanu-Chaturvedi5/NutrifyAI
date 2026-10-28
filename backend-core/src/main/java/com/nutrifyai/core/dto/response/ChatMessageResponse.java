package com.nutrifyai.core.dto.response;

import com.nutrifyai.core.entity.ChatMessage;
import com.nutrifyai.core.entity.enums.ChatRole;

import java.time.OffsetDateTime;

public record ChatMessageResponse(
        Long id,
        ChatRole role,
        String content,
        OffsetDateTime createdAt
) {
    public static ChatMessageResponse from(ChatMessage message) {
        return new ChatMessageResponse(message.getId(), message.getRole(), message.getContent(), message.getCreatedAt());
    }
}
