package com.example.lms.files.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.files")
public record FileStorageProperties(
        String provider,
        String storagePath,
        long maxSizeBytes,
        S3 s3,
        Minio minio,
        Cloudinary cloudinary
) {
    public record S3(String bucket, String region, String endpoint, String publicEndpoint) {
    }

    public record Minio(String bucket, String endpoint, String publicEndpoint, String region) {
    }

    public record Cloudinary(String cloudName) {
    }
}
