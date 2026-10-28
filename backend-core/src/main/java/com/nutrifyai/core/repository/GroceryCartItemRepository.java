package com.nutrifyai.core.repository;

import com.nutrifyai.core.entity.GroceryCartItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface GroceryCartItemRepository extends JpaRepository<GroceryCartItem, Long> {
    List<GroceryCartItem> findAllByCartIdOrderById(Long cartId);
    Optional<GroceryCartItem> findByIdAndCartId(Long id, Long cartId);
    void deleteAllByCartId(Long cartId);
}