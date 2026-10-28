package com.nutrifyai.core.service;

import com.nutrifyai.core.client.AiServiceClient;
import com.nutrifyai.core.dto.request.ProductScanAnalysisResultRequest.ExtractedProduct;
import com.nutrifyai.core.dto.response.PagedResponse;
import com.nutrifyai.core.dto.response.ProductScanResponse;
import com.nutrifyai.core.entity.Product;
import com.nutrifyai.core.entity.ProductIngredient;
import com.nutrifyai.core.entity.ProductNutrition;
import com.nutrifyai.core.entity.ProductScan;
import com.nutrifyai.core.entity.User;
import com.nutrifyai.core.entity.enums.NotificationType;
import com.nutrifyai.core.entity.enums.ProcessingStatus;
import com.nutrifyai.core.entity.enums.ProductSource;
import com.nutrifyai.core.exception.ResourceNotFoundException;
import com.nutrifyai.core.repository.ProductIngredientRepository;
import com.nutrifyai.core.repository.ProductNutritionRepository;
import com.nutrifyai.core.repository.ProductRepository;
import com.nutrifyai.core.repository.ProductScanRepository;
import com.nutrifyai.core.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.OffsetDateTime;

@Service
@RequiredArgsConstructor
public class ProductScanService {

    private final ProductScanRepository productScanRepository;
    private final ProductRepository productRepository;
    private final ProductNutritionRepository productNutritionRepository;
    private final ProductIngredientRepository productIngredientRepository;
    private final UserRepository userRepository;
    private final S3Service s3Service;
    private final AiServiceClient aiServiceClient;
    private final NotificationService notificationService;

    @Transactional
    public ProductScanResponse upload(Long userId, MultipartFile file) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));

        String s3Key = s3Service.upload(file, "product-scans");

        ProductScan scan = ProductScan.builder()
                .user(user)
                .imageUrl(s3Key)
                .processingStatus(ProcessingStatus.PENDING)
                .build();
        scan = productScanRepository.save(scan);

        // Async — doesn't block this response. A failure here is logged,
        // not thrown, same as report analysis triggering.
        aiServiceClient.triggerProductScanAnalysis(scan.getId(), s3Key);
        scan.setProcessingStatus(ProcessingStatus.PROCESSING);
        scan = productScanRepository.save(scan);

        return ProductScanResponse.from(scan);
    }

    @Transactional(readOnly = true)
    public PagedResponse<ProductScanResponse> list(Long userId, Pageable pageable) {
        return PagedResponse.from(
                productScanRepository.findAllByUserIdOrderByUploadedAtDesc(userId, pageable)
                        .map(ProductScanResponse::from)
        );
    }

    @Transactional(readOnly = true)
    public ProductScanResponse getStatus(Long userId, Long scanId) {
        return ProductScanResponse.from(requireOwnedScan(userId, scanId));
    }

    /**
     * Deletes the scan record and its stored photo — deliberately does NOT
     * touch any Product it already created. Once analysis succeeds, that
     * product is a real catalog entry same as anything scanned by anyone
     * else; clearing your scan history shouldn't silently delete data
     * other parts of the app (or other users, eventually) may reference.
     */
    @Transactional
    public void delete(Long userId, Long scanId) {
        ProductScan scan = requireOwnedScan(userId, scanId);
        s3Service.delete(scan.getImageUrl());
        productScanRepository.delete(scan);
    }

    /**
     * Called by ai-service once OCR + LLM extraction finishes. On success,
     * creates the actual Product/ProductNutrition/ProductIngredients rows
     * from the extracted data — from there, the EXISTING personalized-score
     * endpoint (ProductPersonalizationService) already handles "is this
     * suitable for me / how much should I eat", so nothing scan-specific
     * is needed for that part.
     */
    @Transactional
    public void applyAnalysisResult(Long scanId, boolean success, String failureReason, ExtractedProduct extracted) {
        ProductScan scan = productScanRepository.findById(scanId)
                .orElseThrow(() -> new ResourceNotFoundException("Product scan not found: " + scanId));

        if (!success || extracted == null) {
            scan.setProcessingStatus(ProcessingStatus.FAILED);
            scan.setFailureReason(failureReason);
            scan.setProcessedAt(OffsetDateTime.now());
            productScanRepository.save(scan);
            notificationService.create(scan.getUser().getId(), NotificationType.SYSTEM,
                    "Your product scan couldn't be analyzed: " + failureReason);
            return;
        }

        Product product = Product.builder()
                .name(nameOrFallback(extracted.productNameGuess()))
                .brand(extracted.brandGuess())
                .imageUrl(scan.getImageUrl())
                .source(ProductSource.USER_SCANNED)
                .build();
        product = productRepository.save(product);

        ProductNutrition nutrition = ProductNutrition.builder()
                .product(product)
                .servingSize(extracted.servingSize())
                .calories(extracted.calories())
                .proteinG(extracted.proteinG())
                .fatG(extracted.fatG())
                .saturatedFatG(extracted.saturatedFatG())
                .carbsG(extracted.carbsG())
                .sugarG(extracted.sugarG())
                .fiberG(extracted.fiberG())
                .sodiumMg(extracted.sodiumMg())
                .cholesterolMg(extracted.cholesterolMg())
                .build();
        productNutritionRepository.save(nutrition);

        if (extracted.ingredients() != null) {
            short position = 1;
            for (String ingredientName : extracted.ingredients()) {
                if (ingredientName == null || ingredientName.isBlank()) continue;
                ProductIngredient ingredient = ProductIngredient.builder()
                        .product(product)
                        .ingredientName(ingredientName.length() > 150 ? ingredientName.substring(0, 150) : ingredientName)
                        .position(position++)
                        .build();
                productIngredientRepository.save(ingredient);
            }
        }

        scan.setProduct(product);
        scan.setProcessingStatus(ProcessingStatus.COMPLETED);
        scan.setProcessedAt(OffsetDateTime.now());
        productScanRepository.save(scan);
        notificationService.create(scan.getUser().getId(), NotificationType.SYSTEM,
                "Your scanned product \"" + product.getName() + "\" is ready to view.");
    }

    private String nameOrFallback(String nameGuess) {
        if (nameGuess != null && !nameGuess.isBlank()) {
            return nameGuess.length() > 255 ? nameGuess.substring(0, 255) : nameGuess;
        }
        return "Scanned product";
    }

    private ProductScan requireOwnedScan(Long userId, Long scanId) {
        return productScanRepository.findByIdAndUserId(scanId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Product scan not found."));
    }
}