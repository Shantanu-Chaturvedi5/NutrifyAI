package com.nutrifyai.core.repository;

import com.nutrifyai.core.entity.UserAllergy;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserAllergyRepository extends JpaRepository<UserAllergy, UserAllergy.UserAllergyId> {
    List<UserAllergy> findAllById_UserId(Long userId);
}
