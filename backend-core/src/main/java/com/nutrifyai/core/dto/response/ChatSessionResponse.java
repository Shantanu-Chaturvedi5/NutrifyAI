package com.nutrifyai.core.dto.response;

import com.nutrifyai.core.entity.ChatSession;

import java.time.OffsetDateTime;

public record ChatSessionResponse(
        Long id,
        String title,
        OffsetDateTime startedAt,
        OffsetDateTime endedAt
) {
    public static ChatSessionResponse from(ChatSession session) {
        return new ChatSessionResponse(session.getId(), session.getTitle(), session.getStartedAt(), session.getEndedAt());
    }
}
