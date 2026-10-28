package com.nutrifyai.core.repository;

import com.nutrifyai.core.entity.RestaurantMenuItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RestaurantMenuItemRepository extends JpaRepository<RestaurantMenuItem, Long> {
    List<RestaurantMenuItem> findAllByMenuIdOrderById(Long menuId);
}