package com.nutrifyai.core.repository;

import com.nutrifyai.core.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    Optional<User> findByAuthProviderAndProviderId(com.nutrifyai.core.entity.enums.AuthProvider provider, String providerId);
}
