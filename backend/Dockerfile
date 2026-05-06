FROM eclipse-temurin:17-jdk AS build
WORKDIR /app
COPY .mvn .mvn
COPY mvnw mvnw
COPY mvnw.cmd mvnw.cmd
COPY pom.xml pom.xml
RUN chmod +x mvnw
RUN ./mvnw -q -DskipTests dependency:go-offline
COPY src src
RUN ./mvnw -q -DskipTests package

FROM eclipse-temurin:17-jre
WORKDIR /app
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd -r lms \
    && useradd -r -g lms lms \
    && mkdir -p /app/uploads \
    && chown -R lms:lms /app
COPY --from=build /app/target/lms-saas-backend-0.0.1-SNAPSHOT.jar app.jar
USER lms
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 CMD ["curl", "-fsS", "http://localhost:8080/actuator/health"]
ENTRYPOINT ["java", "-jar", "app.jar"]
