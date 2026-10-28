package com.nutrifyai.core.repository;

import com.nutrifyai.core.entity.ProductAlternative;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProductAlternativeRepository extends JpaRepository<ProductAlternative, Long> {
    List<ProductAlternative> findAllByProductIdOrderByRank(Long productId);
}
