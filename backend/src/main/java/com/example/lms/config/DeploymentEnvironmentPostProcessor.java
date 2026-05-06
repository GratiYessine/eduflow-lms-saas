package com.example.lms.config;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.Ordered;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

public class DeploymentEnvironmentPostProcessor implements EnvironmentPostProcessor, Ordered {

    private static final String PROPERTY_SOURCE_NAME = "deploymentEnvironment";

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        Map<String, Object> properties = new HashMap<>();
        configureDatabaseUrl(environment, properties);
        copyIfMissing(environment, properties, "S3_ACCESS_KEY", "AWS_ACCESS_KEY_ID");
        copyIfMissing(environment, properties, "S3_SECRET_KEY", "AWS_SECRET_ACCESS_KEY");
        copyIfMissing(environment, properties, "MINIO_ACCESS_KEY", "AWS_ACCESS_KEY_ID");
        copyIfMissing(environment, properties, "MINIO_SECRET_KEY", "AWS_SECRET_ACCESS_KEY");

        if (!properties.isEmpty()) {
            environment.getPropertySources().addFirst(new MapPropertySource(PROPERTY_SOURCE_NAME, properties));
        }
    }

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE + 20;
    }

    private void configureDatabaseUrl(ConfigurableEnvironment environment, Map<String, Object> properties) {
        String dbUrl = environment.getProperty("DB_URL");
        String databaseUrl = environment.getProperty("DATABASE_URL");
        String candidate = hasText(dbUrl) ? dbUrl : databaseUrl;
        if (!hasText(candidate) || candidate.startsWith("jdbc:postgresql://")) {
            return;
        }

        if (candidate.startsWith("postgres://") || candidate.startsWith("postgresql://")) {
            ParsedDatabaseUrl parsed = parsePostgresUrl(candidate);
            properties.put("DB_URL", parsed.jdbcUrl());
            putIfMissing(environment, properties, "DB_USERNAME", parsed.username());
            putIfMissing(environment, properties, "DB_PASSWORD", parsed.password());
        }
    }

    private ParsedDatabaseUrl parsePostgresUrl(String databaseUrl) {
        URI uri = URI.create(databaseUrl);
        String rawPath = hasText(uri.getRawPath()) ? uri.getRawPath() : "";
        String rawQuery = hasText(uri.getRawQuery()) ? "?" + uri.getRawQuery() : "";
        String port = uri.getPort() > 0 ? ":" + uri.getPort() : "";
        String jdbcUrl = "jdbc:postgresql://" + uri.getHost() + port + rawPath + rawQuery;

        String username = "";
        String password = "";
        String userInfo = uri.getRawUserInfo();
        if (hasText(userInfo)) {
            String[] parts = userInfo.split(":", 2);
            username = decode(parts[0]);
            if (parts.length > 1) {
                password = decode(parts[1]);
            }
        }
        return new ParsedDatabaseUrl(jdbcUrl, username, password);
    }

    private void copyIfMissing(ConfigurableEnvironment environment, Map<String, Object> properties, String source, String target) {
        String value = environment.getProperty(source);
        putIfMissing(environment, properties, target, value);
    }

    private void putIfMissing(ConfigurableEnvironment environment, Map<String, Object> properties, String target, String value) {
        if (!hasText(environment.getProperty(target)) && hasText(value)) {
            properties.put(target, value);
        }
    }

    private String decode(String value) {
        return URLDecoder.decode(value, StandardCharsets.UTF_8);
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private record ParsedDatabaseUrl(String jdbcUrl, String username, String password) {
    }
}
