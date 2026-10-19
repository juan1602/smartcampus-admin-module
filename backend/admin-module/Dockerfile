FROM maven:3.9.9-eclipse-temurin-21-jammy AS builder
WORKDIR /build

COPY pom.xml .
RUN mvn -B -ntp dependency:go-offline

COPY src ./src
RUN mvn -B -ntp clean package -DskipTests

FROM eclipse-temurin:21-jre-jammy
WORKDIR /app

ARG OTEL_AGENT_VERSION=2.11.0
ADD https://github.com/open-telemetry/opentelemetry-java-instrumentation/releases/download/v${OTEL_AGENT_VERSION}/opentelemetry-javaagent.jar \
    /app/opentelemetry-javaagent.jar

COPY --from=builder /build/target/*.jar app.jar

EXPOSE 8081

ENTRYPOINT ["java", \
    "-XX:+UseContainerSupport", \
    "-XX:MaxRAMPercentage=75.0", \
    "-javaagent:/app/opentelemetry-javaagent.jar", \
    "-jar", "app.jar"]