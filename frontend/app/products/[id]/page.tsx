import Link from "next/link";
import { publicFetch, getCurrentUserOptional, authedFetchOptional } from "@/lib/backend";
import { FactsPanel, FactsRow } from "@/components/FactsPanel";
import { ReviewForm, RatingForm } from "@/components/ReviewRatingForms";
import { AddToGroceryButton } from "@/components/AddToGroceryButton";
import { LogIntakeButton } from "@/components/LogIntakeButton";
import type {
  PagedResponse,
  ProductAlternativeResponse,
  ProductResponse,
  ProductScoreResponse,
  ReviewResponse,
  UserResponse,
} from "@/lib/types";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const productId = Number(id);

  const [product, reviews, communityScore, alternatives, user] = await Promise.all([
    publicFetch<ProductResponse>(`/products/${productId}`),
    publicFetch<PagedResponse<ReviewResponse>>(`/products/${productId}/reviews`),
    publicFetch<{ communityHealthScore: number | null }>(`/products/${productId}/ratings/community-score`),
    publicFetch<ProductAlternativeResponse[]>(`/products/${productId}/alternatives`),
    getCurrentUserOptional<UserResponse>(),
  ]);

  const personalizedScore = user
    ? await authedFetchOptional<ProductScoreResponse>(`/products/${productId}/personalized-score`)
    : null;

  const n = product.nutrition;

  return (
    <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-2">
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-black uppercase tracking-tight text-graphite">{product.name}</h1>
          <p className="text-sm text-graphite-70">{product.brand ?? "Unbranded"} · {product.category ?? "Uncategorized"}</p>
          {user && (
            <div className="mt-3 flex flex-wrap gap-2">
              <AddToGroceryButton productId={productId} />
              <LogIntakeButton productId={productId} />
            </div>
          )}
        </div>

        <FactsPanel
          title="Nutrition facts"
          subtitle={n?.servingSize ? `Per ${n.servingSize}` : undefined}
        >
          <FactsRow label="Calories" value={n?.calories ?? "—"} bold />
          <FactsRow label="Protein" value={n?.proteinG != null ? `${n.proteinG} g` : "—"} />
          <FactsRow label="Total fat" value={n?.fatG != null ? `${n.fatG} g` : "—"} />
          <FactsRow label="Saturated fat" value={n?.saturatedFatG != null ? `${n.saturatedFatG} g` : "—"} indent />
          <FactsRow label="Carbohydrates" value={n?.carbsG != null ? `${n.carbsG} g` : "—"} />
          <FactsRow label="Sugar" value={n?.sugarG != null ? `${n.sugarG} g` : "—"} indent />
          <FactsRow label="Fiber" value={n?.fiberG != null ? `${n.fiberG} g` : "—"} indent />
          <FactsRow label="Sodium" value={n?.sodiumMg != null ? `${n.sodiumMg} mg` : "—"} />
          <FactsRow label="Cholesterol" value={n?.cholesterolMg != null ? `${n.cholesterolMg} mg` : "—"} />
          <FactsRow
            label="Community Health Score"
            value={communityScore.communityHealthScore != null ? `${communityScore.communityHealthScore}/100` : "Not yet rated"}
            bold
          />
        </FactsPanel>

        {personalizedScore && (
          <FactsPanel title="Personalized for you" subtitle="Based on your health profile — not a clinical assessment">
            <FactsRow label="Suitability" value={`${personalizedScore.suitabilityScore}/100`} bold />
            <FactsRow label="Health score" value={`${personalizedScore.healthScore}/100`} />
            <FactsRow label="Nutrition score" value={`${personalizedScore.nutritionScore}/100`} />
            <FactsRow label="Risk score" value={`${personalizedScore.riskScore}/100`} />
            <FactsRow label="Recommended" value={personalizedScore.recommendedDailyQuantity} />
            <FactsRow label="Maximum" value={personalizedScore.maxDailyQuantity} />
            <div className="px-4 py-3">
              <p className="mb-1 text-sm font-semibold text-graphite">Why</p>
              <ul className="list-inside list-disc space-y-1 text-sm text-graphite-70">
                {personalizedScore.reasoning.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </div>
          </FactsPanel>
        )}

        {user && !personalizedScore && (
          <p className="text-sm text-graphite-70">
            <Link href="/profile" className="font-semibold text-garnet underline">
              Set up your health profile
            </Link>{" "}
            to see a personalized suitability score for this product.
          </p>
        )}

        {user && (
          <div>
            <h2 className="mb-2 font-display text-lg font-black uppercase tracking-tight text-graphite">Rate this product</h2>
            <RatingForm productId={productId} />
          </div>
        )}

        {alternatives.length > 0 && (
          <div>
            <h2 className="mb-2 font-display text-lg font-black uppercase tracking-tight text-graphite">Healthier swaps</h2>
            <p className="mb-3 text-xs text-graphite-70">
              Nutrition similarity is a real computed score; taste similarity is an ingredient-overlap
              proxy, not actual flavor data.
            </p>
            <ul className="space-y-2">
              {alternatives.map((alt) => (
                <li key={alt.productId}>
                  <Link
                    href={`/products/${alt.productId}`}
                    className="flex items-center justify-between gap-4 rounded-xl border border-hairline bg-card px-3 py-2 hover:bg-linen-deep"
                  >
                    <div>
                      <p className="font-medium text-graphite">{alt.name}</p>
                      <p className="text-xs text-graphite-70">{alt.brand ?? "Unbranded"}</p>
                    </div>
                    <div className="font-data text-right text-xs text-graphite">
                      <p>Nutrition match: {alt.nutritionSimilarityPct}%</p>
                      <p className="text-graphite-70">Taste match: {alt.tasteSimilarityPct}%</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="space-y-6">
        <div>
          <h2 className="mb-4 font-display text-lg font-black uppercase tracking-tight text-graphite">Reviews</h2>
          {user ? (
            <div className="mb-4"><ReviewForm productId={productId} /></div>
          ) : (
            <p className="mb-4 text-sm text-graphite-70">
              <a href="/login" className="font-semibold text-garnet underline">Log in</a> to write a review.
            </p>
          )}

          {reviews.content.length === 0 ? (
            <p className="text-sm text-graphite-70">No reviews yet — be the first.</p>
          ) : (
            <ul className="space-y-4">
              {reviews.content.map((review) => (
                <li key={review.id} className="rounded-2xl border border-hairline bg-card p-3">
                  <p className="text-sm text-graphite">{review.reviewText}</p>
                  <p className="mt-2 text-xs text-graphite-70">
                    {review.userFullName} · {new Date(review.createdAt).toLocaleDateString()}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}