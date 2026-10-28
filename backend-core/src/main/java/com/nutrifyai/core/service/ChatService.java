package com.nutrifyai.core.service;

import com.nutrifyai.core.client.AiServiceClient;
import com.nutrifyai.core.dto.response.ChatMessageResponse;
import com.nutrifyai.core.dto.response.ChatSessionResponse;
import com.nutrifyai.core.dto.response.PagedResponse;
import com.nutrifyai.core.entity.ChatMessage;
import com.nutrifyai.core.entity.ChatSession;
import com.nutrifyai.core.entity.HealthProfile;
import com.nutrifyai.core.entity.User;
import com.nutrifyai.core.entity.enums.ChatRole;
import com.nutrifyai.core.exception.ResourceNotFoundException;
import com.nutrifyai.core.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatSessionRepository chatSessionRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;
    private final HealthProfileRepository healthProfileRepository;
    private final UserMedicalConditionRepository userMedicalConditionRepository;
    private final UserHealthGoalRepository userHealthGoalRepository;
    private final UserAllergyRepository userAllergyRepository;
    private final AiServiceClient aiServiceClient;

    @Transactional
    public ChatSessionResponse createSession(Long userId, String title) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));

        ChatSession session = ChatSession.builder()
                .user(user)
                .title(title != null && !title.isBlank() ? title : "New conversation")
                .build();

        return ChatSessionResponse.from(chatSessionRepository.save(session));
    }

    @Transactional(readOnly = true)
    public PagedResponse<ChatSessionResponse> listSessions(Long userId, Pageable pageable) {
        return PagedResponse.from(
                chatSessionRepository.findAllByUserIdOrderByStartedAtDesc(userId, pageable)
                        .map(ChatSessionResponse::from)
        );
    }

    @Transactional(readOnly = true)
    public List<ChatMessageResponse> getMessages(Long userId, Long sessionId) {
        requireOwnedSession(userId, sessionId);
        return chatMessageRepository.findAllBySessionIdOrderByCreatedAt(sessionId).stream()
                .map(ChatMessageResponse::from)
                .toList();
    }

    @Transactional
    public ChatMessageResponse sendMessage(Long userId, Long sessionId, String userMessageText) {
        ChatSession session = requireOwnedSession(userId, sessionId);

        // Auto-title like Claude/ChatGPT do — only on the session's first
        // message, and only if the user hasn't already set one explicitly
        // (createSession defaults to "New conversation" when none is given,
        // so that's the untitled marker; a rename should never get
        // silently overwritten by this).
        boolean isFirstMessage = !chatMessageRepository.existsBySessionId(sessionId);
        if (isFirstMessage && "New conversation".equals(session.getTitle())) {
            session.setTitle(titleFromMessage(userMessageText));
            chatSessionRepository.save(session);
        }

        ChatMessage userMessage = ChatMessage.builder()
                .session(session)
                .role(ChatRole.USER)
                .content(userMessageText)
                .build();
        chatMessageRepository.save(userMessage);

        Map<String, Object> healthContext = buildHealthContext(userId);
        AiServiceClient.ChatMessageResult result = aiServiceClient.sendChatMessage(userId, userMessageText, healthContext);

        List<Object> retrievedContext = result.retrievedContext() == null
                ? List.of()
                : result.retrievedContext().stream().map(c -> (Object) Map.of("source", c.source(), "score", c.score())).toList();

        ChatMessage assistantMessage = ChatMessage.builder()
                .session(session)
                .role(ChatRole.ASSISTANT)
                .content(result.reply())
                .retrievedContext(retrievedContext)
                .build();

        return ChatMessageResponse.from(chatMessageRepository.save(assistantMessage));
    }

    private Map<String, Object> buildHealthContext(Long userId) {
        Map<String, Object> context = new HashMap<>();

        healthProfileRepository.findByUserId(userId).ifPresent((HealthProfile profile) -> {
            context.put("age", profile.getAge());
            context.put("dietaryPreference", profile.getDietaryPreference());
            context.put("activityLevel", profile.getActivityLevel());
        });

        List<String> conditions = userMedicalConditionRepository.findAllByUserId(userId).stream()
                .map(umc -> umc.getCondition().getName())
                .toList();
        if (!conditions.isEmpty()) context.put("medicalConditions", conditions);

        List<String> goals = userHealthGoalRepository.findAllByUserIdAndActiveTrue(userId).stream()
                .map(uhg -> uhg.getGoal().getName())
                .toList();
        if (!goals.isEmpty()) context.put("healthGoals", goals);

        List<String> allergies = userAllergyRepository.findAllById_UserId(userId).stream()
                .map(ua -> ua.getAllergy().getName())
                .toList();
        if (!allergies.isEmpty()) context.put("allergies", allergies);

        return context;
    }

    @Transactional
    public ChatSessionResponse rename(Long userId, Long sessionId, String newTitle) {
        ChatSession session = requireOwnedSession(userId, sessionId);
        session.setTitle(newTitle);
        return ChatSessionResponse.from(chatSessionRepository.save(session));
    }

    @Transactional
    public void delete(Long userId, Long sessionId) {
        ChatSession session = requireOwnedSession(userId, sessionId);
        // Messages cascade at the DB level (chat_messages.session_id ON
        // DELETE CASCADE) — nothing else to clean up here.
        chatSessionRepository.delete(session);
    }

    private static final int TITLE_MAX_LENGTH = 50;

    /** Same idea as Claude/ChatGPT's auto-titling, done deterministically
     * from the message text itself rather than a separate LLM call — no
     * added latency or failure point on every session's first message. */
    private String titleFromMessage(String message) {
        String trimmed = message.trim().replaceAll("\\s+", " ");
        if (trimmed.length() <= TITLE_MAX_LENGTH) {
            return trimmed;
        }
        int cut = trimmed.lastIndexOf(' ', TITLE_MAX_LENGTH);
        if (cut <= 0) cut = TITLE_MAX_LENGTH;
        return trimmed.substring(0, cut) + "…";
    }

    private ChatSession requireOwnedSession(Long userId, Long sessionId) {
        ChatSession session = chatSessionRepository.findByIdAndUserId(sessionId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Chat session not found."));
        return session;
    }
}