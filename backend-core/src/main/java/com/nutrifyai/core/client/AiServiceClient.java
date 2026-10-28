package com.nutrifyai.core.client;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
public class AiServiceClient {

    private final HttpClient httpClient = HttpClient.newBuilder()
        .version(HttpClient.Version.HTTP_1_1)
        .connectTimeout(Duration.ofSeconds(10))
        .build();
    private final String baseUrl;
    private final String internalToken;
    private final ObjectMapper objectMapper;

    public AiServiceClient(
            @Value("${nutrifyai.ai-service.base-url}") String baseUrl,
            @Value("${nutrifyai.ai-service.internal-token}") String internalToken,
            ObjectMapper objectMapper
    ) {
        this.baseUrl = baseUrl;
        this.internalToken = internalToken;
        this.objectMapper = objectMapper;
    }

    // Deliberately bypassing Spring's RestClient here — two attempts at
    // fixing its body serialization didn't change the outcome, which means
    // something about how it selects a message converter in this project's
    // dependency mix isn't behaving as expected. JDK's own HttpClient with a
    // manually-built JSON string removes that uncertainty entirely: there is
    // no converter negotiation left for anything to get wrong.
    private <T> T post(String path, Object payload, Class<T> responseType) {
        try {
            String json = objectMapper.writeValueAsString(payload);
            log.info("Calling ai-service POST {} with body: {}", path, json);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(baseUrl + path))
                    .header("Content-Type", "application/json")
                    .header("X-Internal-Token", internalToken)
                    .POST(HttpRequest.BodyPublishers.ofString(json))
                    .build();
            
            System.out.println("URI = " + request.uri());
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            log.info("ai-service responded {} : {}", response.statusCode(), response.body());

            if (response.statusCode() >= 400) {
                throw new IllegalStateException(
                        "ai-service returned " + response.statusCode() + ": " + response.body());
            }

            return objectMapper.readValue(response.body(), responseType);
        } catch (Exception e) {
            throw new RuntimeException("Call to ai-service " + path + " failed", e);
        }
    }

    @Async
    public void triggerReportAnalysis(Long reportId, String s3Key, String reportType, HealthContext healthContext) {
        try {
            post("/api/v1/report-analyzer/analyze",
                    new ReportAnalysisTriggerRequest(reportId, s3Key, reportType, healthContext), Map.class);
        } catch (Exception e) {
            log.warn("Could not reach ai-service to analyze report {} (expected until Phase 4 ships): {}",
                    reportId, e.getMessage());
        }
    }

    @Async
    public void triggerProductScanAnalysis(Long scanId, String s3Key) {
        try {
            post("/api/v1/product-scanner/analyze",
                    new ProductScanTriggerRequest(scanId, s3Key), Map.class);
        } catch (Exception e) {
            log.warn("Could not reach ai-service to analyze product scan {}: {}", scanId, e.getMessage());
        }
    }

    @Async
    public void triggerDietPlanGeneration(Long planId, BigDecimal calorieTarget, BigDecimal proteinTarget, HealthContext healthContext) {
        try {
            post("/api/v1/diet-plan-generator/generate",
                    new DietPlanTriggerRequest(planId, calorieTarget, proteinTarget, healthContext), Map.class);
        } catch (Exception e) {
            log.warn("Could not reach ai-service to generate diet plan {}: {}", planId, e.getMessage());
        }
    }

    @Async
    public void triggerRestaurantMenuAnalysis(Long menuId, String s3Key, HealthContext healthContext) {
        try {
            post("/api/v1/restaurant-menu-analyzer/analyze",
                    new RestaurantMenuTriggerRequest(menuId, s3Key, healthContext), Map.class);
        } catch (Exception e) {
            log.warn("Could not reach ai-service to analyze restaurant menu {}: {}", menuId, e.getMessage());
        }
    }

    public ChatMessageResult sendChatMessage(Long userId, String message, Map<String, Object> healthContext) {
        return post("/api/v1/chatbot/message",
                new ChatMessageTriggerRequest(userId, message, healthContext), ChatMessageResult.class);
    }

    public ScoreProductResult computePersonalizedScore(
            NutritionInput nutrition, List<String> ingredients, HealthContext healthContext
    ) {
        return post("/api/v1/personalize/score",
                new ScoreProductRequest(nutrition, ingredients, healthContext), ScoreProductResult.class);
    }

    public PeopleLikeYouResult getPeopleLikeYou(Long userId) {
        return post("/api/v1/recommend/people-like-you", Map.of("userId", userId), PeopleLikeYouResult.class);
    }

    public RecomputeAlternativesResult recomputeAlternatives(String category) {
        return post("/api/v1/recommend/alternatives/recompute", Map.of("category", category), RecomputeAlternativesResult.class);
    }

    public NutritionTwinResult generateNutritionTwin(Long userId) {
        return post("/api/v1/nutrition-twin/generate", Map.of("userId", userId), NutritionTwinResult.class);
    }

    public record ReportAnalysisTriggerRequest(Long reportId, String s3Key, String reportType, HealthContext healthContext) {
    }

    public record ProductScanTriggerRequest(Long scanId, String s3Key) {
    }

    public record DietPlanTriggerRequest(Long planId, BigDecimal calorieTarget, BigDecimal proteinTarget, HealthContext healthContext) {
    }

    public record RestaurantMenuTriggerRequest(Long menuId, String s3Key, HealthContext healthContext) {
    }

    public record ChatMessageTriggerRequest(Long userId, String message, Map<String, Object> healthContext) {
    }

    public record ChatMessageResult(String reply, List<RetrievedChunk> retrievedContext) {
    }

    public record NutritionInput(
            java.math.BigDecimal calories,
            java.math.BigDecimal proteinG,
            java.math.BigDecimal fatG,
            java.math.BigDecimal saturatedFatG,
            java.math.BigDecimal carbsG,
            java.math.BigDecimal sugarG,
            java.math.BigDecimal fiberG,
            java.math.BigDecimal sodiumMg,
            java.math.BigDecimal cholesterolMg
    ) {
    }

    public record HealthContext(
            List<String> conditions,
            List<String> goals,
            List<String> allergies,
            String dietaryPreference
    ) {
    }

    public record ScoreProductRequest(NutritionInput nutrition, List<String> ingredients, HealthContext healthContext) {
    }

    public record ScoreProductResult(
            int suitabilityScore,
            int healthScore,
            int nutritionScore,
            int riskScore,
            List<String> reasoning,
            String recommendedDailyQuantity,
            String maxDailyQuantity
    ) {
    }

    public record PeopleLikeYouResult(List<RecommendedProduct> recommendations) {
    }

    public record RecommendedProduct(Long productId, String name, String brand, double score, String reasoning) {
    }

    public record RecomputeAlternativesResult(String category, int productsUpdated) {
    }

    public record NutritionTwinResult(
            String snapshotDate,
            String healthTrendSummary,
            String deficiencyTrendSummary,
            String riskPredictionSummary
    ) {
    }

    public record RetrievedChunk(String source, double score) {
    }
}