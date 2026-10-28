package com.nutrifyai.core.service;

import com.nutrifyai.core.client.AiServiceClient;
import com.nutrifyai.core.dto.response.NutritionTwinResponse;
import com.nutrifyai.core.entity.NutritionTwinSnapshot;
import com.nutrifyai.core.exception.ResourceNotFoundException;
import com.nutrifyai.core.repository.NutritionTwinSnapshotRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class NutritionTwinService {

    private final NutritionTwinSnapshotRepository nutritionTwinSnapshotRepository;
    private final AiServiceClient aiServiceClient;

    @Transactional(readOnly = true)
    public NutritionTwinResponse getLatest(Long userId) {
        NutritionTwinSnapshot snapshot = nutritionTwinSnapshotRepository.findFirstByUserIdOrderBySnapshotDateDesc(userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No nutrition twin snapshot yet — generate one with POST /api/v1/nutrition-twin/generate."));
        return NutritionTwinResponse.from(snapshot);
    }

    /**
     * The ai-service computes the trend and writes the snapshot row
     * directly to Postgres (see ai-service/app/ml/nutrition_twin.py) — we
     * build the response from its return value rather than re-querying,
     * since it's the same data either way.
     */
    public NutritionTwinResponse generate(Long userId) {
        AiServiceClient.NutritionTwinResult result = aiServiceClient.generateNutritionTwin(userId);
        return new NutritionTwinResponse(
                LocalDate.parse(result.snapshotDate()),
                result.healthTrendSummary(),
                result.deficiencyTrendSummary(),
                result.riskPredictionSummary()
        );
    }
}
