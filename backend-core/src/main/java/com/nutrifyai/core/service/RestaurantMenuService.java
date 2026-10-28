package com.nutrifyai.core.service;

import com.nutrifyai.core.client.AiServiceClient;
import com.nutrifyai.core.dto.request.RestaurantMenuAnalysisResultRequest.MenuItemInput;
import com.nutrifyai.core.dto.response.PagedResponse;
import com.nutrifyai.core.dto.response.RestaurantMenuItemResponse;
import com.nutrifyai.core.dto.response.RestaurantMenuResponse;
import com.nutrifyai.core.entity.RestaurantMenu;
import com.nutrifyai.core.entity.RestaurantMenuItem;
import com.nutrifyai.core.entity.User;
import com.nutrifyai.core.entity.enums.NotificationType;
import com.nutrifyai.core.entity.enums.ProcessingStatus;
import com.nutrifyai.core.exception.ResourceNotFoundException;
import com.nutrifyai.core.repository.RestaurantMenuItemRepository;
import com.nutrifyai.core.repository.RestaurantMenuRepository;
import com.nutrifyai.core.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RestaurantMenuService {

    private final RestaurantMenuRepository restaurantMenuRepository;
    private final RestaurantMenuItemRepository restaurantMenuItemRepository;
    private final UserRepository userRepository;
    private final S3Service s3Service;
    private final AiServiceClient aiServiceClient;
    private final HealthContextService healthContextService;
    private final NotificationService notificationService;

    @Transactional
    public RestaurantMenuResponse upload(Long userId, MultipartFile file) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));

        String s3Key = s3Service.upload(file, "restaurant-menus");

        RestaurantMenu menu = RestaurantMenu.builder()
                .user(user)
                .imageUrl(s3Key)
                .processingStatus(ProcessingStatus.PENDING)
                .build();
        menu = restaurantMenuRepository.save(menu);

        AiServiceClient.HealthContext healthContext = healthContextService.build(userId);
        aiServiceClient.triggerRestaurantMenuAnalysis(menu.getId(), s3Key, healthContext);

        menu.setProcessingStatus(ProcessingStatus.PROCESSING);
        menu = restaurantMenuRepository.save(menu);

        return toResponse(menu);
    }

    @Transactional(readOnly = true)
    public PagedResponse<RestaurantMenuResponse> list(Long userId, Pageable pageable) {
        return PagedResponse.from(
                restaurantMenuRepository.findAllByUserIdOrderByUploadedAtDesc(userId, pageable)
                        .map(this::toResponse)
        );
    }

    @Transactional(readOnly = true)
    public RestaurantMenuResponse getStatus(Long userId, Long menuId) {
        return toResponse(requireOwnedMenu(userId, menuId));
    }

    @Transactional
    public void delete(Long userId, Long menuId) {
        RestaurantMenu menu = requireOwnedMenu(userId, menuId);
        s3Service.delete(menu.getImageUrl());
        restaurantMenuRepository.delete(menu);
    }

    /**
     * Called by ai-service once OCR + LLM parsing finishes. Unlike product
     * scans, menu items were never meant to become catalog Products — the
     * schema stores estimated calories/protein and a recommendation
     * directly on restaurant_menu_items, so this just persists what
     * ai-service already reasoned about (it received the user's health
     * context at trigger time, same as diet plan generation).
     */
    @Transactional
    public void applyAnalysisResult(Long menuId, boolean success, String failureReason,
                                     String restaurantNameGuess, List<MenuItemInput> items) {
        RestaurantMenu menu = restaurantMenuRepository.findById(menuId)
                .orElseThrow(() -> new ResourceNotFoundException("Restaurant menu not found: " + menuId));

        if (!success || items == null || items.isEmpty()) {
            menu.setProcessingStatus(ProcessingStatus.FAILED);
            menu.setFailureReason(failureReason != null ? failureReason : "No menu items could be read from this photo.");
            restaurantMenuRepository.save(menu);
            notificationService.create(menu.getUser().getId(), NotificationType.SYSTEM,
                    "Your restaurant menu scan couldn't be analyzed: " + menu.getFailureReason());
            return;
        }

        if (restaurantNameGuess != null && !restaurantNameGuess.isBlank()) {
            menu.setRestaurantName(restaurantNameGuess.length() > 255 ? restaurantNameGuess.substring(0, 255) : restaurantNameGuess);
        }
        menu.setProcessingStatus(ProcessingStatus.COMPLETED);
        restaurantMenuRepository.save(menu);

        for (MenuItemInput item : items) {
            if (item.itemName() == null || item.itemName().isBlank()) continue;
            RestaurantMenuItem entity = RestaurantMenuItem.builder()
                    .menu(menu)
                    .itemName(item.itemName().length() > 255 ? item.itemName().substring(0, 255) : item.itemName())
                    .estimatedCalories(item.estimatedCalories())
                    .estimatedProteinG(item.estimatedProteinG())
                    .isRecommended(Boolean.TRUE.equals(item.isRecommended()))
                    .recommendationReason(item.recommendationReason())
                    .build();
            restaurantMenuItemRepository.save(entity);
        }

        notificationService.create(menu.getUser().getId(), NotificationType.NEW_RECOMMENDATION,
                (menu.getRestaurantName() != null ? "Your menu from " + menu.getRestaurantName() : "Your restaurant menu")
                        + " has been analyzed — check out the recommended picks.");
    }

    private RestaurantMenu requireOwnedMenu(Long userId, Long menuId) {
        return restaurantMenuRepository.findByIdAndUserId(menuId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Restaurant menu not found."));
    }

    private RestaurantMenuResponse toResponse(RestaurantMenu menu) {
        List<RestaurantMenuItemResponse> items = restaurantMenuItemRepository.findAllByMenuIdOrderById(menu.getId()).stream()
                .map(i -> new RestaurantMenuItemResponse(
                        i.getId(), i.getItemName(), i.getEstimatedCalories(), i.getEstimatedProteinG(),
                        i.isRecommended(), i.getRecommendationReason()
                ))
                .toList();
        return new RestaurantMenuResponse(
                menu.getId(), menu.getRestaurantName(), menu.getProcessingStatus(),
                menu.getFailureReason(), menu.getUploadedAt(), items
        );
    }
}