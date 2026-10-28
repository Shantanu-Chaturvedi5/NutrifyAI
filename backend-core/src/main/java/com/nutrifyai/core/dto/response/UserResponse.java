package com.nutrifyai.core.dto.response;

import com.nutrifyai.core.entity.Role;
import com.nutrifyai.core.entity.User;

import java.util.List;

public record UserResponse(
        Long id,
        String email,
        String fullName,
        String phone,
        List<String> roles
) {
    public static UserResponse from(User user) {
        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getPhone(),
                user.getRoles().stream().map(Role::getName).toList()
        );
    }
}
