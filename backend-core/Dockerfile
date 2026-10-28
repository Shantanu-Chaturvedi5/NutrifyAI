FROM maven:3.9-eclipse-temurin-21 AS builder
WORKDIR /app
COPY pom.xml .
RUN mvn -B dependency:go-offline
COPY src ./src
RUN mvn -B package -DskipTests

FROM eclipse-temurin:21-jre-alpine
# Fixed uid/gid (1500) matching ai-service's non-root user — they share
# the local_uploads Docker volume (see docker-compose.yml) as a fallback
# for local dev without real S3 credentials.
RUN addgroup -S -g 1500 app && adduser -S -u 1500 -G app app \
    && mkdir -p /app/data/uploads \
    && chown -R app:app /app
WORKDIR /app
COPY --from=builder /app/target/*.jar app.jar
USER app
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]