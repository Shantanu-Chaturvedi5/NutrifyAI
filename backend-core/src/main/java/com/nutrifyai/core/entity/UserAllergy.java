package com.nutrifyai.core.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.io.Serializable;
import java.util.Objects;

@Entity
@Table(name = "user_allergies")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserAllergy {

    @EmbeddedId
    private UserAllergyId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("userId")
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("allergyId")
    @JoinColumn(name = "allergy_id")
    private Allergy allergy;

    @Embeddable
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserAllergyId implements Serializable {
        @Column(name = "user_id")
        private Long userId;

        @Column(name = "allergy_id")
        private Short allergyId;

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof UserAllergyId that)) return false;
            return Objects.equals(userId, that.userId) && Objects.equals(allergyId, that.allergyId);
        }

        @Override
        public int hashCode() {
            return Objects.hash(userId, allergyId);
        }
    }
}
