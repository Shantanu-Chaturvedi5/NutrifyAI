package com.nutrifyai.core.service;

import com.nutrifyai.core.client.AiServiceClient;
import com.nutrifyai.core.dto.response.ProductScoreResponse;
import com.nutrifyai.core.entity.Product;
import com.nutrifyai.core.entity.ProductNutrition;
import com.nutrifyai.core.entity.ProductScore;
import com.nutrifyai.core.exception.ResourceNotFoundException;
import com.nutrifyai.core.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductPersonalizationService {

    private static final String REASONING_DELIMITER = " | ";

    private final ProductRepository productRepository;
    private final ProductNutritionRepository productNutritionRepository;
    private final ProductIngredientRepository productIngredientRepository;
    private final ProductScoreRepository productScoreRepository;
    private final UserRepository userRepository;
    private final HealthContextService healthContextService;
    private final AiServiceClient aiServiceClient;

    /**
     * Always recomputes rather than serving a cached row — the rules
     * engine is fast (no LLM call) and the user's profile or the
     * product's data could have changed since the last score.
     */
    @Transactional
    public ProductScoreResponse getPersonalizedScore(Long userId, Long productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found."));

        ProductNutrition nutrition = productNutritionRepository.findByProductId(productId)
                .orElseThrow(() -> new ResourceNotFoundException("This product has no nutrition data yet."));

        List<String> ingredients = productIngredientRepository.findAllByProductIdOrderByPosition(productId).stream()
                .map(com.nutrifyai.core.entity.ProductIngredient::getIngredientName)
                .toList();

        AiServiceClient.HealthContext healthContext = healthContextService.build(userId);

        AiServiceClient.NutritionInput nutritionInput = new AiServiceClient.NutritionInput(
                nutrition.getCalories(), nutrition.getProteinG(), nutrition.getFatG(),
                nutrition.getSaturatedFatG(), nutrition.getCarbsG(), nutrition.getSugarG(),
                nutrition.getFiberG(), nutrition.getSodiumMg(), nutrition.getCholesterolMg()
        );

        AiServiceClient.ScoreProductResult result = aiServiceClient.computePersonalizedScore(
                nutritionInput, ingredients, healthContext);

        persistScore(product, userId, result);

        return new ProductScoreResponse(
                productId, result.suitabilityScore(), result.healthScore(),
                result.nutritionScore(), result.riskScore(), result.reasoning(),
                result.recommendedDailyQuantity(), result.maxDailyQuantity()
        );
    }

    private void persistScore(Product product, Long userId, AiServiceClient.ScoreProductResult result) {
        ProductScore score = productScoreRepository.findByProductIdAndUserId(product.getId(), userId)
                .orElseGet(() -> ProductScore.builder()
                        .product(product)
                        .user(userRepository.getReferenceById(userId))
                        .build());

        score.setSuitabilityScore((short) result.suitabilityScore());
        score.setHealthScore((short) result.healthScore());
        score.setNutritionScore((short) result.nutritionScore());
        score.setRiskScore((short) result.riskScore());
        score.setReasoning(String.join(REASONING_DELIMITER, result.reasoning()));
        score.setRecommendedDailyQuantity(result.recommendedDailyQuantity());
        score.setMaxDailyQuantity(result.maxDailyQuantity());

        productScoreRepository.save(score);
    }
}