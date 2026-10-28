package com.nutrifyai.core.repository;

import com.nutrifyai.core.entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    List<ChatMessage> findAllBySessionIdOrderByCreatedAt(Long sessionId);
    boolean existsBySessionId(Long sessionId);
}