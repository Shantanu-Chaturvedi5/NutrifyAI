package com.nutrifyai.core.repository;

import com.nutrifyai.core.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long> {
    Optional<Product> findByBarcode(String barcode);

    Page<Product> findAllByCategoryIgnoreCase(String category, Pageable pageable);

    @Query("SELECT DISTINCT p.category FROM Product p WHERE p.category IS NOT NULL ORDER BY p.category")
    java.util.List<String> findDistinctCategories();

    // pg_trgm-backed fuzzy search — see idx_products_name_trgm in schema.sql
    @Query(value = "SELECT * FROM products WHERE name % :query ORDER BY similarity(name, :query) DESC",
           countQuery = "SELECT count(*) FROM products WHERE name % :query",
           nativeQuery = true)
    Page<Product> searchByName(@Param("query") String query, Pageable pageable);
}