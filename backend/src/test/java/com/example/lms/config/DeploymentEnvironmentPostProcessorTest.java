package com.example.lms.config;

import org.junit.jupiter.api.Test;
import org.springframework.boot.SpringApplication;
import org.springframework.mock.env.MockEnvironment;

import static org.assertj.core.api.Assertions.assertThat;

class DeploymentEnvironmentPostProcessorTest {

    private final DeploymentEnvironmentPostProcessor processor = new DeploymentEnvironmentPostProcessor();

    @Test
    void convertsRenderDatabaseUrlToJdbcProperties() {
        MockEnvironment environment = new MockEnvironment()
                .withProperty("DATABASE_URL", "postgres://render_user:render_pass@db.internal:5432/lms_prod?sslmode=require");

        processor.postProcessEnvironment(environment, new SpringApplication(Object.class));

        assertThat(environment.getProperty("DB_URL"))
                .isEqualTo("jdbc:postgresql://db.internal:5432/lms_prod?sslmode=require");
        assertThat(environment.getProperty("DB_USERNAME")).isEqualTo("render_user");
        assertThat(environment.getProperty("DB_PASSWORD")).isEqualTo("render_pass");
    }

    @Test
    void mapsS3CredentialsToAwsSdkEnvironmentNamesWhenMissing() {
        MockEnvironment environment = new MockEnvironment()
                .withProperty("S3_ACCESS_KEY", "access")
                .withProperty("S3_SECRET_KEY", "secret");

        processor.postProcessEnvironment(environment, new SpringApplication(Object.class));

        assertThat(environment.getProperty("AWS_ACCESS_KEY_ID")).isEqualTo("access");
        assertThat(environment.getProperty("AWS_SECRET_ACCESS_KEY")).isEqualTo("secret");
    }
}
