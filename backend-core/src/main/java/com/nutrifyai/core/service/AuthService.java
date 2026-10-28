package com.nutrifyai.core.service;

import com.nutrifyai.core.dto.request.ForgotPasswordRequest;
import com.nutrifyai.core.dto.request.LoginRequest;
import com.nutrifyai.core.dto.request.RegisterRequest;
import com.nutrifyai.core.dto.request.ResetPasswordRequest;
import com.nutrifyai.core.dto.response.AuthResponse;
import com.nutrifyai.core.dto.response.UserResponse;
import com.nutrifyai.core.entity.PasswordResetToken;
import com.nutrifyai.core.entity.RefreshToken;
import com.nutrifyai.core.entity.Role;
import com.nutrifyai.core.entity.User;
import com.nutrifyai.core.entity.enums.AuthProvider;
import com.nutrifyai.core.exception.BadRequestException;
import com.nutrifyai.core.exception.DuplicateResourceException;
import com.nutrifyai.core.exception.ResourceNotFoundException;
import com.nutrifyai.core.exception.UnauthorizedException;
import com.nutrifyai.core.repository.PasswordResetTokenRepository;
import com.nutrifyai.core.repository.RefreshTokenRepository;
import com.nutrifyai.core.repository.RoleRepository;
import com.nutrifyai.core.repository.UserRepository;
import com.nutrifyai.core.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.HashSet;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final EmailService emailService;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new DuplicateResourceException("An account with this email already exists.");
        }

        Role userRole = roleRepository.findByName(Role.USER)
                .orElseThrow(() -> new IllegalStateException("USER role not seeded — check schema seed data"));
        Set<Role> roles = new HashSet<>();
        roles.add(userRole);

        User user = User.builder()
                .email(request.email())
                .passwordHash(passwordEncoder.encode(request.password()))
                .fullName(request.fullName())
                .phone(request.phone())
                .authProvider(AuthProvider.LOCAL)
                .emailVerified(false)
                .active(true)
                .roles(roles)
                .build();

        user = userRepository.save(user);
        return issueTokens(user, null);
    }

    @Transactional
    public AuthResponse login(LoginRequest request, String deviceInfo) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new UnauthorizedException("Invalid email or password."));

        if (user.getPasswordHash() == null) {
            throw new UnauthorizedException(
                    "This account uses %s sign-in — log in that way instead.".formatted(user.getAuthProvider()));
        }

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new UnauthorizedException("Invalid email or password.");
        }

        if (!user.isActive()) {
            throw new UnauthorizedException("This account has been deactivated.");
        }

        return issueTokens(user, deviceInfo);
    }

    @Transactional
    public AuthResponse refresh(String rawRefreshToken) {
        String hash = jwtService.hashToken(rawRefreshToken);
        RefreshToken stored = refreshTokenRepository.findByTokenHash(hash)
                .orElseThrow(() -> new UnauthorizedException("Invalid refresh token."));

        if (stored.isRevoked() || stored.getExpiresAt().isBefore(OffsetDateTime.now())) {
            throw new UnauthorizedException("Refresh token expired or revoked — please log in again.");
        }

        // Rotate: revoke the used token, issue a brand new pair.
        stored.setRevoked(true);
        refreshTokenRepository.save(stored);

        return issueTokens(stored.getUser(), stored.getDeviceInfo());
    }

    @Transactional
    public void logout(String rawRefreshToken) {
        String hash = jwtService.hashToken(rawRefreshToken);
        refreshTokenRepository.findByTokenHash(hash).ifPresent(token -> {
            token.setRevoked(true);
            refreshTokenRepository.save(token);
        });
    }

    @Transactional
    public void logoutAllDevices(Long userId) {
        refreshTokenRepository.deleteAllByUserId(userId);
    }

    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        // Deliberately don't reveal whether the email exists — same response either way.
        userRepository.findByEmail(request.email()).ifPresent(user -> {
            String rawToken = jwtService.generateOpaqueToken();
            PasswordResetToken resetToken = PasswordResetToken.builder()
                    .user(user)
                    .tokenHash(jwtService.hashToken(rawToken))
                    .expiresAt(OffsetDateTime.now().plusHours(1))
                    .used(false)
                    .build();
            passwordResetTokenRepository.save(resetToken);
            emailService.sendPasswordResetEmail(user.getEmail(), rawToken);
        });
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        String hash = jwtService.hashToken(request.token());
        PasswordResetToken resetToken = passwordResetTokenRepository.findByTokenHash(hash)
                .orElseThrow(() -> new BadRequestException("Invalid or expired reset token."));

        if (resetToken.isUsed() || resetToken.getExpiresAt().isBefore(OffsetDateTime.now())) {
            throw new BadRequestException("Invalid or expired reset token.");
        }

        User user = resetToken.getUser();
        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);

        resetToken.setUsed(true);
        passwordResetTokenRepository.save(resetToken);

        // Any refresh tokens issued before a password reset should die with it.
        refreshTokenRepository.deleteAllByUserId(user.getId());
    }

    private AuthResponse issueTokens(User user, String deviceInfo) {
        var roleNames = user.getRoles().stream().map(Role::getName).toList();
        String accessToken = jwtService.generateAccessToken(user.getId(), user.getEmail(), roleNames);

        String rawRefreshToken = jwtService.generateOpaqueToken();
        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .tokenHash(jwtService.hashToken(rawRefreshToken))
                .deviceInfo(deviceInfo)
                .expiresAt(OffsetDateTime.now().plusDays(jwtService.getRefreshTokenTtlDays()))
                .revoked(false)
                .build();
        refreshTokenRepository.save(refreshToken);

        return new AuthResponse(
                accessToken,
                rawRefreshToken,
                "Bearer",
                15 * 60,
                UserResponse.from(user)
        );
    }

    public User requireUserOrThrow(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));
    }
}
