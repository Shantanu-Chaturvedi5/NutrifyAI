package com.nutrifyai.core.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class S3Service {

    /** Keys returned by the local-disk fallback carry this prefix so a
     * reader (this class, and ai-service's s3_client.py) can tell them
     * apart from a real S3 key without a separate DB column. */
    private static final String LOCAL_PREFIX = "local:";

    private final S3Client s3Client;

    @Value("${nutrifyai.aws.s3-bucket}")
    private String bucket;

    @Value("${AWS_ACCESS_KEY_ID:}")
    private String accessKeyId;

    @Value("${AWS_SECRET_ACCESS_KEY:}")
    private String secretAccessKey;

    @Value("${nutrifyai.local-storage.path:/app/data/uploads}")
    private String localStoragePath;

    /**
     * Uploads under a per-day prefix so a bucket listing stays browsable,
     * and returns the S3 key (not a public URL — reports/labels are
     * private; generate a presigned GET URL on read, don't store one).
     *
     * Falls back to a local disk directory (shared with ai-service via a
     * Docker volume — see docker-compose.yml) when no AWS credentials are
     * configured, so local development doesn't require a real S3 bucket.
     * Without this, every upload throws (S3Config still builds an S3Client
     * against a bucket that doesn't exist for you) and the request 500s.
     */
    public String upload(MultipartFile file, String folder) {
        String key = "%s/%s/%s-%s".formatted(
                folder,
                LocalDate.now(),
                UUID.randomUUID(),
                sanitizeFilename(file.getOriginalFilename())
        );

        if (accessKeyId.isBlank() || secretAccessKey.isBlank()) {
            return uploadToLocalDisk(file, key);
        }

        try {
            s3Client.putObject(
                    PutObjectRequest.builder()
                            .bucket(bucket)
                            .key(key)
                            .contentType(file.getContentType())
                            .build(),
                    RequestBody.fromInputStream(file.getInputStream(), file.getSize())
            );
        } catch (IOException e) {
            throw new UncheckedIOException("Failed to read uploaded file", e);
        }

        return key;
    }

    private String uploadToLocalDisk(MultipartFile file, String key) {
        try {
            Path target = Path.of(localStoragePath, key);
            Files.createDirectories(target.getParent());
            file.transferTo(target);
        } catch (IOException e) {
            throw new UncheckedIOException("Failed to save uploaded file to local storage", e);
        }
        return LOCAL_PREFIX + key;
    }

    /**
     * Best-effort — logs and swallows failures rather than throwing, so a
     * storage hiccup (or a key from before this service existed) can never
     * block the user from deleting the database record they actually care
     * about removing.
     */
    public void delete(String key) {
        try {
            if (key.startsWith(LOCAL_PREFIX)) {
                Path target = Path.of(localStoragePath, key.substring(LOCAL_PREFIX.length()));
                Files.deleteIfExists(target);
            } else {
                s3Client.deleteObject(DeleteObjectRequest.builder().bucket(bucket).key(key).build());
            }
        } catch (Exception e) {
            log.warn("Could not delete stored file for key {}: {}", key, e.getMessage());
        }
    }

    private String sanitizeFilename(String filename) {
        if (filename == null) return "file";
        return filename.replaceAll("[^a-zA-Z0-9._-]", "_");
    }
}