package com.nutrifyai.core.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Logs the reset link instead of sending real email. Swap this out for a
 * real implementation (SES, SendGrid, etc.) behind the same interface when
 * you're ready — nothing else in the codebase needs to change.
 */
@Slf4j
@Service
public class ConsoleEmailService implements EmailService {

    @Override
    public void sendPasswordResetEmail(String toEmail, String rawResetToken) {
        log.info("[DEV EMAIL] Password reset for {}: token={} (build the reset link as " +
                "https://<frontend-host>/reset-password?token={})", toEmail, rawResetToken, rawResetToken);
    }
}
