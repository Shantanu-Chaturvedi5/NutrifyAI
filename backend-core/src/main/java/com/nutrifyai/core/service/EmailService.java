package com.nutrifyai.core.service;

public interface EmailService {
    void sendPasswordResetEmail(String toEmail, String rawResetToken);
}
