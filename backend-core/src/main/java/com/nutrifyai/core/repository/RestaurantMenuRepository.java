package com.nutrifyai.core.repository;

import com.nutrifyai.core.entity.RestaurantMenu;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RestaurantMenuRepository extends JpaRepository<RestaurantMenu, Long> {
    Page<RestaurantMenu> findAllByUserIdOrderByUploadedAtDesc(Long userId, Pageable pageable);
    Optional<RestaurantMenu> findByIdAndUserId(Long id, Long userId);
}