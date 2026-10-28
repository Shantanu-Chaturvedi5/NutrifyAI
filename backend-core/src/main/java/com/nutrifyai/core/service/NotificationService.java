package com.nutrifyai.core.service;

import com.nutrifyai.core.dto.response.NotificationResponse;
import com.nutrifyai.core.dto.response.PagedResponse;
import com.nutrifyai.core.entity.Notification;
import com.nutrifyai.core.entity.User;
import com.nutrifyai.core.entity.enums.NotificationType;
import com.nutrifyai.core.exception.ResourceNotFoundException;
import com.nutrifyai.core.repository.NotificationRepository;
import com.nutrifyai.core.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    /**
     * Called from the completion points of async features (report
     * analysis, product scans, diet plan generation) — never thrown from,
     * since a notification failing to save should never break the actual
     * feature it's describing.
     */
    @Transactional
    public void create(Long userId, NotificationType type, String message) {
        try {
            User user = userRepository.findById(userId).orElse(null);
            if (user == null) {
                log.warn("Skipped notification for missing user {}", userId);
                return;
            }
            notificationRepository.save(Notification.builder().user(user).type(type).message(message).build());
        } catch (Exception e) {
            log.warn("Could not create notification for user {}: {}", userId, e.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public PagedResponse<NotificationResponse> list(Long userId, Pageable pageable) {
        return PagedResponse.from(
                notificationRepository.findAllByUserIdOrderByCreatedAtDesc(userId, pageable)
                        .map(NotificationResponse::from)
        );
    }

    @Transactional(readOnly = true)
    public long unreadCount(Long userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    @Transactional
    public void markRead(Long userId, Long notificationId) {
        Notification notification = notificationRepository.findByIdAndUserId(notificationId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found."));
        notification.setRead(true);
        notificationRepository.save(notification);
    }

    @Transactional
    public void markAllRead(Long userId) {
        notificationRepository.findAllByUserIdOrderByCreatedAtDesc(userId, Pageable.unpaged())
                .forEach(n -> {
                    if (!n.isRead()) {
                        n.setRead(true);
                        notificationRepository.save(n);
                    }
                });
    }
}