package com.example.lms.files.config;

import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.AwsCredentialsProvider;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

import java.net.URI;

@Configuration
@ConditionalOnExpression("'${app.files.provider:local}' == 's3' || '${app.files.provider:local}' == 'minio'")
public class S3StorageConfig {

    @Bean
    S3Client s3Client(FileStorageProperties properties, Environment environment) {
        var builder = S3Client.builder()
                .credentialsProvider(credentialsProvider(properties, environment))
                .region(region(properties))
                .serviceConfiguration(S3Configuration.builder().pathStyleAccessEnabled(true).build());
        String endpoint = endpoint(properties);
        if (endpoint != null && !endpoint.isBlank()) {
            builder.endpointOverride(URI.create(endpoint));
        }
        return builder.build();
    }

    @Bean
    S3Presigner s3Presigner(FileStorageProperties properties, Environment environment) {
        var builder = S3Presigner.builder()
                .credentialsProvider(credentialsProvider(properties, environment))
                .region(region(properties))
                .serviceConfiguration(S3Configuration.builder().pathStyleAccessEnabled(true).build());
        String endpoint = publicEndpoint(properties);
        if (endpoint != null && !endpoint.isBlank()) {
            builder.endpointOverride(URI.create(endpoint));
        }
        return builder.build();
    }

    private Region region(FileStorageProperties properties) {
        String region = "minio".equals(properties.provider()) ? nullSafe(properties.minio().region()) : nullSafe(properties.s3().region());
        return Region.of(region == null || region.isBlank() ? "us-east-1" : region);
    }

    private AwsCredentialsProvider credentialsProvider(FileStorageProperties properties, Environment environment) {
        String accessKey = storageCredential(properties, environment, true);
        String secretKey = storageCredential(properties, environment, false);
        if (!accessKey.isBlank() && !secretKey.isBlank()) {
            return StaticCredentialsProvider.create(AwsBasicCredentials.create(accessKey, secretKey));
        }
        return DefaultCredentialsProvider.create();
    }

    private String storageCredential(FileStorageProperties properties, Environment environment, boolean accessKey) {
        String provider = properties.provider();
        String minioKey = accessKey ? "MINIO_ACCESS_KEY" : "MINIO_SECRET_KEY";
        String s3Key = accessKey ? "S3_ACCESS_KEY" : "S3_SECRET_KEY";
        String awsKey = accessKey ? "AWS_ACCESS_KEY_ID" : "AWS_SECRET_ACCESS_KEY";
        if ("minio".equals(provider)) {
            String minioValue = nullSafe(environment.getProperty(minioKey));
            if (!minioValue.isBlank()) {
                return minioValue;
            }
        }
        String s3Value = nullSafe(environment.getProperty(s3Key));
        return s3Value.isBlank() ? nullSafe(environment.getProperty(awsKey)) : s3Value;
    }

    private String endpoint(FileStorageProperties properties) {
        return "minio".equals(properties.provider()) ? nullSafe(properties.minio().endpoint()) : nullSafe(properties.s3().endpoint());
    }

    private String publicEndpoint(FileStorageProperties properties) {
        String publicEndpoint = "minio".equals(properties.provider())
                ? nullSafe(properties.minio().publicEndpoint())
                : nullSafe(properties.s3().publicEndpoint());
        return publicEndpoint == null || publicEndpoint.isBlank() ? endpoint(properties) : publicEndpoint;
    }

    private String nullSafe(String value) {
        return value == null ? "" : value;
    }
}
