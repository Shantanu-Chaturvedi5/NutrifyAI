package com.nutrifyai.core.repository;

import com.nutrifyai.core.entity.GroceryCart;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface GroceryCartRepository extends JpaRepository<GroceryCart, Long> {
    Optional<GroceryCart> findFirstByUserIdOrderByUploadedAtDesc(Long userId);
}