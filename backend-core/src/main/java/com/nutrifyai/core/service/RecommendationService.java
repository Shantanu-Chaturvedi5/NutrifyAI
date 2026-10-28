package com.nutrifyai.core.service;

import com.nutrifyai.core.client.AiServiceClient;
import com.nutrifyai.core.dto.response.PeopleLikeYouItemResponse;
import com.nutrifyai.core.entity.Recommendation;
import com.nutrifyai.core.entity.User;
import com.nutrifyai.core.entity.enums.RecommendationType;
import com.nutrifyai.core.repository.RecommendationRepository;
import com.nutrifyai.core.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RecommendationService {

    private final AiServiceClient aiServiceClient;
    private final RecommendationRepository recommendationRepository;
    private final UserRepository userRepository;

    /**
     * Recomputes on every call rather than serving a cache — this needs a
     * health profile to exist (ai-service returns an empty list otherwise,
     * not an error) and can shift as soon as the user or their peers rate
     * more products.
     */
    @Transactional
    public List<PeopleLikeYouItemResponse> getPeopleLikeYou(Long userId) {
        AiServiceClient.PeopleLikeYouResult result = aiServiceClient.getPeopleLikeYou(userId);

        recommendationRepository.deleteAllByUserIdAndRecommendationType(userId, RecommendationType.PEOPLE_LIKE_YOU);

        User user = userRepository.getReferenceById(userId);
        for (AiServiceClient.RecommendedProduct product : result.recommendations()) {
            Recommendation recommendation = Recommendation.builder()
                    .user(user)
                    .recommendationType(RecommendationType.PEOPLE_LIKE_YOU)
                    .referenceId(product.productId())
                    .score(BigDecimal.valueOf(product.score()))
                    .reasoning(product.reasoning())
                    .build();
            recommendationRepository.save(recommendation);
        }

        return result.recommendations().stream()
                .map(p -> new PeopleLikeYouItemResponse(p.productId(), p.name(), p.brand(), p.score(), p.reasoning()))
                .toList();
    }
}
