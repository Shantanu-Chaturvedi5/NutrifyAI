package com.nutrifyai.core.controller;

import com.nutrifyai.core.dto.request.RenameChatSessionRequest;
import com.nutrifyai.core.dto.request.SendChatMessageRequest;
import com.nutrifyai.core.dto.response.ChatMessageResponse;
import com.nutrifyai.core.dto.response.ChatSessionResponse;
import com.nutrifyai.core.dto.response.PagedResponse;
import com.nutrifyai.core.security.SecurityUser;
import com.nutrifyai.core.service.ChatService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/chat")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Chat", description = "RAG-backed nutrition assistant, personalized with the user's health profile")
public class ChatController {

    private final ChatService chatService;

    @PostMapping("/sessions")
    @Operation(summary = "Start a new chat session")
    public ResponseEntity<ChatSessionResponse> createSession(
            @AuthenticationPrincipal SecurityUser currentUser,
            @RequestBody(required = false) Map<String, String> body
    ) {
        String title = body != null ? body.get("title") : null;
        ChatSessionResponse response = chatService.createSession(currentUser.getId(), title);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/sessions")
    @Operation(summary = "List my chat sessions, newest first")
    public ResponseEntity<PagedResponse<ChatSessionResponse>> listSessions(
            @AuthenticationPrincipal SecurityUser currentUser,
            Pageable pageable
    ) {
        return ResponseEntity.ok(chatService.listSessions(currentUser.getId(), pageable));
    }

    @GetMapping("/sessions/{sessionId}/messages")
    @Operation(summary = "Get message history for a session")
    public ResponseEntity<List<ChatMessageResponse>> getMessages(
            @AuthenticationPrincipal SecurityUser currentUser,
            @PathVariable Long sessionId
    ) {
        return ResponseEntity.ok(chatService.getMessages(currentUser.getId(), sessionId));
    }

    @PostMapping("/sessions/{sessionId}/messages")
    @Operation(summary = "Send a message and get the assistant's reply (blocks until the LLM responds)")
    public ResponseEntity<ChatMessageResponse> sendMessage(
            @AuthenticationPrincipal SecurityUser currentUser,
            @PathVariable Long sessionId,
            @Valid @RequestBody SendChatMessageRequest request
    ) {
        return ResponseEntity.ok(chatService.sendMessage(currentUser.getId(), sessionId, request.message()));
    }

    @PatchMapping("/sessions/{sessionId}")
    @Operation(summary = "Rename a chat session")
    public ResponseEntity<ChatSessionResponse> rename(
            @AuthenticationPrincipal SecurityUser currentUser,
            @PathVariable Long sessionId,
            @Valid @RequestBody RenameChatSessionRequest request
    ) {
        return ResponseEntity.ok(chatService.rename(currentUser.getId(), sessionId, request.title()));
    }

    @DeleteMapping("/sessions/{sessionId}")
    @Operation(summary = "Delete a chat session and its messages")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal SecurityUser currentUser,
            @PathVariable Long sessionId
    ) {
        chatService.delete(currentUser.getId(), sessionId);
        return ResponseEntity.noContent().build();
    }
}