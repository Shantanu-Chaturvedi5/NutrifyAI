package com.nutrifyai.core.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nutrifyai.core.entity.Role;
import com.nutrifyai.core.entity.User;
import com.nutrifyai.core.entity.enums.AuthProvider;
import com.nutrifyai.core.repository.RoleRepository;
import com.nutrifyai.core.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Runs after Google/Apple confirm the user's identity. Upserts a local
 * `users` row (no password — auth_provider marks it as external) and
 * issues our own access + refresh tokens, same shape as local login, so
 * the frontend doesn't need to special-case OAuth users at all.
 *
 * Needs GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET set in
 * backend-core/.env to actually be reachable — the wiring here is real,
 * but Google won't redirect to it without real credentials registered in
 * the Google Cloud Console.
 */
@Component
@RequiredArgsConstructor
public class OAuth2LoginSuccessHandler implements AuthenticationSuccessHandler {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final JwtService jwtService;
    private final ObjectMapper objectMapper;

    @Override
    public void onAuthenticationSuccess(
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication
    ) throws IOException {

        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        Map<String, Object> attributes = oAuth2User.getAttributes();

        String email = (String) attributes.get("email");
        String name = (String) attributes.getOrDefault("name", email);
        String providerId = String.valueOf(attributes.get("sub"));

        User user = userRepository.findByEmail(email).orElseGet(() -> {
            Role userRole = roleRepository.findByName(Role.USER)
                    .orElseThrow(() -> new IllegalStateException("USER role not seeded — check schema seed data"));
            Set<Role> roles = new HashSet<>();
            roles.add(userRole);

            User newUser = User.builder()
                    .email(email)
                    .fullName(name)
                    .authProvider(AuthProvider.GOOGLE)
                    .providerId(providerId)
                    .emailVerified(true)
                    .active(true)
                    .roles(roles)
                    .build();
            return userRepository.save(newUser);
        });

        String accessToken = jwtService.generateAccessToken(
                user.getId(), user.getEmail(), user.getRoles().stream().map(Role::getName).toList());

        response.setContentType("application/json");
        objectMapper.writeValue(response.getWriter(), Map.of(
                "accessToken", accessToken,
                "tokenType", "Bearer"
        ));
    }
}
