package com.nutrifyai.core.repository;

import com.nutrifyai.core.entity.ChatSession;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ChatSessionRepository extends JpaRepository<ChatSession, Long> {
    Page<ChatSession> findAllByUserIdOrderByStartedAtDesc(Long userId, Pageable pageable);
    Optional<ChatSession> findByIdAndUserId(Long id, Long userId);
}
