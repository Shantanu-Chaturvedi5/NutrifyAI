package com.nutrifyai.core.service;

import com.nutrifyai.core.dto.request.AddGroceryItemRequest;
import com.nutrifyai.core.dto.response.GroceryCartItemResponse;
import com.nutrifyai.core.dto.response.GroceryCartResponse;
import com.nutrifyai.core.entity.GroceryCart;
import com.nutrifyai.core.entity.GroceryCartItem;
import com.nutrifyai.core.entity.Product;
import com.nutrifyai.core.entity.User;
import com.nutrifyai.core.exception.BadRequestException;
import com.nutrifyai.core.exception.ResourceNotFoundException;
import com.nutrifyai.core.repository.GroceryCartItemRepository;
import com.nutrifyai.core.repository.GroceryCartRepository;
import com.nutrifyai.core.repository.ProductRepository;
import com.nutrifyai.core.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class GroceryCartService {

    private final GroceryCartRepository groceryCartRepository;
    private final GroceryCartItemRepository groceryCartItemRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final RatingService ratingService;

    @Transactional
    public GroceryCartResponse getCurrent(Long userId) {
        GroceryCart cart = getOrCreateCurrentCart(userId);
        return toResponse(cart);
    }

    @Transactional
    public GroceryCartResponse addItem(Long userId, AddGroceryItemRequest request) {
        boolean hasProduct = request.productId() != null;
        boolean hasRawName = request.rawItemName() != null && !request.rawItemName().isBlank();

        if (!hasProduct && !hasRawName) {
            throw new BadRequestException("Provide either a product to add, or a name for the item.");
        }

        GroceryCart cart = getOrCreateCurrentCart(userId);

        GroceryCartItem.GroceryCartItemBuilder itemBuilder = GroceryCartItem.builder()
                .cart(cart)
                .quantity(request.quantity())
                .unit(request.unit());

        if (hasProduct) {
            Product product = productRepository.findById(request.productId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + request.productId()));
            itemBuilder.product(product).rawItemName(product.getName());
        } else {
            String name = request.rawItemName().trim();
            itemBuilder.rawItemName(name.length() > 255 ? name.substring(0, 255) : name);
        }

        groceryCartItemRepository.save(itemBuilder.build());
        recomputeHealthScore(cart);
        return toResponse(cart);
    }

    @Transactional
    public GroceryCartResponse updateQuantity(Long userId, Long itemId, short quantity) {
        GroceryCart cart = getOrCreateCurrentCart(userId);
        GroceryCartItem item = groceryCartItemRepository.findByIdAndCartId(itemId, cart.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Item not found in your current list."));
        item.setQuantity(quantity);
        groceryCartItemRepository.save(item);
        return toResponse(cart);
    }

    @Transactional
    public GroceryCartResponse removeItem(Long userId, Long itemId) {
        GroceryCart cart = getOrCreateCurrentCart(userId);
        GroceryCartItem item = groceryCartItemRepository.findByIdAndCartId(itemId, cart.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Item not found in your current list."));
        groceryCartItemRepository.delete(item);
        recomputeHealthScore(cart);
        return toResponse(cart);
    }

    @Transactional
    public GroceryCartResponse clearList(Long userId) {
        GroceryCart cart = getOrCreateCurrentCart(userId);
        groceryCartItemRepository.deleteAllByCartId(cart.getId());
        cart.setCartHealthScore(null);
        groceryCartRepository.save(cart);
        return toResponse(cart);
    }

    /**
     * Averages the community health score (see RatingService — average
     * healthiness rating across everyone who's rated the product, scaled
     * to 0-100) across every item in the cart that's linked to a real
     * product. Free-text items and unrated products are excluded, not
     * counted as zero — an item with no data shouldn't drag the average
     * down as if it were unhealthy. Not weighted by quantity: this is
     * "how healthy is what's in your cart", not "total health burden of
     * everything you're buying", which would need real nutrition-per-unit
     * math this feature deliberately doesn't attempt.
     */
    private void recomputeHealthScore(GroceryCart cart) {
        List<GroceryCartItem> items = groceryCartItemRepository.findAllByCartIdOrderById(cart.getId());
        List<Double> scores = items.stream()
                .filter(i -> i.getProduct() != null)
                .map(i -> ratingService.communityHealthScore(i.getProduct().getId()))
                .filter(s -> s != null)
                .toList();

        cart.setCartHealthScore(scores.isEmpty() ? null : (short) Math.round(scores.stream().mapToDouble(Double::doubleValue).average().orElse(0)));
        groceryCartRepository.save(cart);
    }

    /**
     * One "current" list per user — the most recently created cart, or a
     * fresh empty one if this is their first time. No status field on the
     * table to mark a cart done/abandoned, so this keeps things simple:
     * everything accumulates in one ongoing list until explicitly cleared.
     */
    private GroceryCart getOrCreateCurrentCart(Long userId) {
        return groceryCartRepository.findFirstByUserIdOrderByUploadedAtDesc(userId)
                .orElseGet(() -> {
                    User user = userRepository.findById(userId)
                            .orElseThrow(() -> new ResourceNotFoundException("User not found."));
                    return groceryCartRepository.save(GroceryCart.builder().user(user).build());
                });
    }

    private GroceryCartResponse toResponse(GroceryCart cart) {
        List<GroceryCartItem> rawItems = groceryCartItemRepository.findAllByCartIdOrderById(cart.getId());
        List<GroceryCartItemResponse> items = rawItems.stream()
                .map(i -> new GroceryCartItemResponse(
                        i.getId(),
                        i.getProduct() != null ? i.getProduct().getId() : null,
                        i.getProduct() != null ? i.getProduct().getName() : null,
                        i.getProduct() != null ? i.getProduct().getImageUrl() : null,
                        i.getRawItemName(),
                        i.getQuantity(),
                        i.getUnit()
                ))
                .toList();
        int analyzedCount = (int) rawItems.stream().filter(i -> i.getProduct() != null).count();
        return new GroceryCartResponse(cart.getId(), cart.getCartHealthScore(), analyzedCount, cart.getUploadedAt(), items);
    }
}