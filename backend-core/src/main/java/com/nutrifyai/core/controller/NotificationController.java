package com.nutrifyai.core.controller;

import com.nutrifyai.core.dto.response.NotificationResponse;
import com.nutrifyai.core.dto.response.PagedResponse;
import com.nutrifyai.core.security.SecurityUser;
import com.nutrifyai.core.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Notifications")
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    @Operation(summary = "List my notifications, newest first")
    public ResponseEntity<PagedResponse<NotificationResponse>> list(
            @AuthenticationPrincipal SecurityUser currentUser,
            Pageable pageable
    ) {
        return ResponseEntity.ok(notificationService.list(currentUser.getId(), pageable));
    }

    @GetMapping("/unread-count")
    @Operation(summary = "Count of unread notifications, for a nav badge")
    public ResponseEntity<Map<String, Long>> unreadCount(@AuthenticationPrincipal SecurityUser currentUser) {
        return ResponseEntity.ok(Map.of("unreadCount", notificationService.unreadCount(currentUser.getId())));
    }

    @PatchMapping("/{notificationId}/read")
    @Operation(summary = "Mark one notification as read")
    public ResponseEntity<Void> markRead(
            @AuthenticationPrincipal SecurityUser currentUser,
            @PathVariable Long notificationId
    ) {
        notificationService.markRead(currentUser.getId(), notificationId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/mark-all-read")
    @Operation(summary = "Mark all my notifications as read")
    public ResponseEntity<Void> markAllRead(@AuthenticationPrincipal SecurityUser currentUser) {
        notificationService.markAllRead(currentUser.getId());
        return ResponseEntity.noContent().build();
    }
}