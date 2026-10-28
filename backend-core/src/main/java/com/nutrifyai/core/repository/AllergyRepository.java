package com.nutrifyai.core.repository;

import com.nutrifyai.core.entity.Allergy;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AllergyRepository extends JpaRepository<Allergy, Short> {
}
