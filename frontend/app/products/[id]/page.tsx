import Link from "next/link";
import {
  ArrowLeft,
  Barcode,
  Check,
  CircleHelp,
  Leaf,
  Sparkles,
  Star,
} from "lucide-react";
import { publicFetch, getCurrentUserOptional, authedFetchOptional } from "@/lib/backend";
import { RadialGauge } from "@/components/ui/RadialGauge";
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

const scoreMetrics = [
  ["Health", "healthScore", "var(--sage)"],
  ["Nutrition", "nutritionScore", "var(--scan-action)"],
  ["Risk indicators · higher means more risk", "riskScore", "var(--garnet)"],
] as const;

function clampScore(score: number) {
  return Math.max(0, Math.min(100, Number.isFinite(score) ? score : 0));
}

function formatSource(source: ProductResponse["source"]) {
  return source === "USER_SCANNED" ? "Scanned label" : source === "CATALOG" ? "Product catalog" : "Added manually";
}

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

  const nutrition = product.nutrition;
  const nutrients = [
    { label: "Calories", value: nutrition?.calories, unit: "kcal", featured: true },
    { label: "Protein", value: nutrition?.proteinG, unit: "g" },
    { label: "Carbohydrates", value: nutrition?.carbsG, unit: "g" },
    { label: "Total fat", value: nutrition?.fatG, unit: "g" },
    { label: "Saturated fat", value: nutrition?.saturatedFatG, unit: "g" },
    { label: "Sugar", value: nutrition?.sugarG, unit: "g" },
    { label: "Fiber", value: nutrition?.fiberG, unit: "g" },
    { label: "Sodium", value: nutrition?.sodiumMg, unit: "mg" },
    { label: "Cholesterol", value: nutrition?.cholesterolMg, unit: "mg" },
  ].filter((item) => item.value != null);

  return (
    <main className="mx-auto max-w-6xl space-y-6 pb-12 text-graphite">
      <Link
        href="/products"
        className="inline-flex items-center gap-2 rounded-lg text-sm font-semibold text-graphite-70 transition hover:text-graphite focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage"
      >
        <ArrowLeft className="h-4 w-4" />
        All products
      </Link>

      <header className="overflow-hidden rounded-[28px] border border-hairline bg-card shadow-[0_20px_50px_rgba(28,34,28,0.07)]">
        <div className="h-1.5 bg-gradient-to-r from-[#5e9d76] via-[#b2c69a] to-[#e6ead2]" />
        <div className="flex flex-col gap-6 p-5 sm:p-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-sage-soft px-3 py-1 font-data text-[10px] font-semibold uppercase tracking-[0.13em] text-sage">
                {product.source === "USER_SCANNED" ? <Sparkles className="h-3 w-3" /> : <Leaf className="h-3 w-3" />}
                {formatSource(product.source)}
              </span>
              {product.category && (
                <span className="rounded-full bg-linen px-3 py-1 font-data text-[10px] font-semibold uppercase tracking-[0.12em] text-graphite-70">
                  {product.category}
                </span>
              )}
            </div>
            <h1 className="break-words font-display text-3xl font-semibold leading-tight tracking-[-0.05em] sm:text-4xl">
              {product.name}
            </h1>
            <p className="mt-2 text-base text-graphite-70">{product.brand ?? "Unbranded product"}</p>
            {product.description && (
              <p className="mt-4 max-w-2xl text-sm leading-6 text-graphite-70">{product.description}</p>
            )}
          </div>
          {user && (
            <div className="flex flex-wrap gap-2">
              <AddToGroceryButton productId={productId} />
              <LogIntakeButton productId={productId} />
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-hairline bg-linen/50 px-5 py-3 text-xs text-graphite-70 sm:px-8">
          {nutrition?.servingSize && (
            <span className="font-medium">Serving size: {nutrition.servingSize}</span>
          )}
          {product.barcode && (
            <span className="inline-flex items-center gap-1.5 font-data">
              <Barcode className="h-3.5 w-3.5" />
              {product.barcode}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5">
            <Star className="h-3.5 w-3.5 text-saffron" />
            Community score: {communityScore.communityHealthScore != null
              ? `${communityScore.communityHealthScore}/100`
              : "Not rated yet"}
          </span>
        </div>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)]">
        <div className="space-y-6">
          <section className="overflow-hidden rounded-3xl border border-hairline bg-card shadow-sm">
            <div className="flex items-end justify-between gap-3 border-b border-hairline px-5 py-5 sm:px-6">
              <div>
                <p className="font-data text-[10px] font-semibold uppercase tracking-[0.16em] text-sage">Per serving</p>
                <h2 className="mt-1 font-display text-2xl font-semibold tracking-[-0.03em]">Nutrition facts</h2>
              </div>
              {nutrition?.servingSize && (
                <span className="text-right text-xs text-graphite-70">{nutrition.servingSize}</span>
              )}
            </div>
            {nutrients.length === 0 ? (
              <div className="px-5 py-10 text-center sm:px-6">
                <CircleHelp className="mx-auto h-6 w-6 text-graphite-45" />
                <p className="mt-3 font-medium">Nutrition details aren’t available</p>
                <p className="mt-1 text-sm text-graphite-70">No nutrient values were recorded for this product.</p>
              </div>
            ) : (
              <div className="grid gap-px bg-hairline sm:grid-cols-2">
                {nutrients.map((item) => (
                  <div
                    key={item.label}
                    className={`flex items-center justify-between gap-3 bg-card px-5 py-4 sm:px-6 ${item.featured ? "sm:col-span-2 sm:bg-sage-soft/35" : ""}`}
                  >
                    <span className={`text-sm ${item.featured ? "font-semibold text-graphite" : "text-graphite-70"}`}>
                      {item.label}
                    </span>
                    <span className={`font-data tabular-nums text-graphite ${item.featured ? "text-xl font-semibold" : "text-sm font-medium"}`}>
                      {item.value} <span className="text-xs font-normal text-graphite-45">{item.unit}</span>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {personalizedScore && (
            <section className="overflow-hidden rounded-3xl border border-sage/20 bg-card shadow-sm">
              <div className="border-b border-sage/15 px-5 py-5 sm:px-6">
                <p className="font-data text-[10px] font-semibold uppercase tracking-[0.16em] text-sage">Your health profile</p>
                <h2 className="mt-1 font-display text-2xl font-semibold tracking-[-0.03em]">Personalized fit</h2>
                <p className="mt-1 text-xs text-graphite-70">A transparent heuristic, not a clinical assessment.</p>
              </div>
              <div className="grid gap-5 p-5 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center sm:p-6">
                <div className="flex items-center gap-4 sm:block sm:text-center">
                  <RadialGauge
                    value={clampScore(personalizedScore.suitabilityScore)}
                    max={100}
                    label="FIT"
                    size={112}
                    color="var(--sage)"
                  />
                  <div className="sm:mt-2">
                    <p className="text-sm font-semibold">Suitability</p>
                    <p className="text-xs text-graphite-70">out of 100</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {scoreMetrics.map(([label, key, color]) => {
                    const score = clampScore(personalizedScore[key]);
                    return (
                      <div key={key}>
                        <div className="mb-1.5 flex items-center justify-between text-xs">
                          <span className="text-graphite-70">{label}</span>
                          <span className="font-data font-semibold text-graphite">{score}/100</span>
                        </div>
                        <div
                          role="progressbar"
                          aria-label={`${label} score`}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-valuenow={score}
                          className="h-2 overflow-hidden rounded-full bg-linen-deep"
                        >
                          <div className="h-full rounded-full transition-[width]" style={{ width: `${score}%`, backgroundColor: color }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="grid gap-px border-t border-hairline bg-hairline sm:grid-cols-2">
                <div className="bg-card px-5 py-4 sm:px-6">
                  <p className="text-xs text-graphite-70">Suggested daily amount</p>
                  <p className="mt-1 font-semibold text-graphite">{personalizedScore.recommendedDailyQuantity}</p>
                </div>
                <div className="bg-card px-5 py-4 sm:px-6">
                  <p className="text-xs text-graphite-70">Maximum daily amount</p>
                  <p className="mt-1 font-semibold text-graphite">{personalizedScore.maxDailyQuantity}</p>
                </div>
              </div>
              {personalizedScore.reasoning.length > 0 && (
                <div className="border-t border-hairline px-5 py-5 sm:px-6">
                  <h3 className="mb-3 text-sm font-semibold">Why this score?</h3>
                  <ul className="space-y-2.5">
                    {personalizedScore.reasoning.map((reason, index) => (
                      <li key={`${index}-${reason}`} className="flex gap-2.5 text-sm leading-6 text-graphite-70">
                        <Check className="mt-1 h-4 w-4 shrink-0 text-sage" />
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          )}

          {user && !personalizedScore && (
            <div className="flex gap-3 rounded-3xl border border-saffron/20 bg-saffron-soft/40 p-5">
              <CircleHelp className="mt-0.5 h-5 w-5 shrink-0 text-saffron" />
              <p className="text-sm leading-6 text-graphite-70">
                <Link href="/profile" className="font-semibold text-graphite underline underline-offset-2">
                  Complete your health profile
                </Link>{" "}
                to see a personalized product score.
              </p>
            </div>
          )}

          {product.source === "USER_SCANNED" && (
            <p className="rounded-2xl border border-hairline bg-linen/60 px-4 py-3 text-xs leading-5 text-graphite-70">
              Nutrient details were extracted from a product-label image and may contain recognition errors. Check the original packaging before relying on them.
            </p>
          )}
        </div>

        <aside className="space-y-6">
          {user && (
            <section className="rounded-3xl border border-hairline bg-card p-5 shadow-sm sm:p-6">
              <p className="font-data text-[10px] font-semibold uppercase tracking-[0.16em] text-sage">Your feedback</p>
              <h2 className="mt-1 font-display text-xl font-semibold">Rate this product</h2>
              <div className="mt-4"><RatingForm productId={productId} /></div>
            </section>
          )}

          <section className="rounded-3xl border border-hairline bg-card p-5 shadow-sm sm:p-6">
            <div className="mb-4">
              <p className="font-data text-[10px] font-semibold uppercase tracking-[0.16em] text-sage">Community notes</p>
              <h2 className="mt-1 font-display text-xl font-semibold">Reviews</h2>
            </div>
            {user ? (
              <div className="mb-5"><ReviewForm productId={productId} /></div>
            ) : (
              <p className="mb-5 text-sm text-graphite-70">
                <Link href="/login" className="font-semibold underline underline-offset-2">Log in</Link> to write a review.
              </p>
            )}
            {reviews.content.length === 0 ? (
              <p className="rounded-2xl bg-linen/70 px-4 py-5 text-center text-sm text-graphite-70">No reviews yet. Be the first to share your experience.</p>
            ) : (
              <ul className="space-y-3">
                {reviews.content.map((review) => (
                  <li key={review.id} className="rounded-2xl bg-linen/65 p-4">
                    <p className="text-sm leading-6 text-graphite">{review.reviewText}</p>
                    <p className="mt-3 text-xs text-graphite-70">
                      {review.userFullName} · <time suppressHydrationWarning>{new Date(review.createdAt).toLocaleDateString()}</time>
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {alternatives.length > 0 && (
            <section className="rounded-3xl border border-hairline bg-card p-5 shadow-sm sm:p-6">
              <p className="font-data text-[10px] font-semibold uppercase tracking-[0.16em] text-sage">Explore options</p>
              <h2 className="mt-1 font-display text-xl font-semibold">Similar products</h2>
              <p className="mt-1 text-xs leading-5 text-graphite-70">
                Similarity is calculated from nutrition and ingredient overlap; it isn’t a taste test.
              </p>
              <ul className="mt-4 space-y-2">
                {alternatives.map((alternative) => (
                  <li key={alternative.productId}>
                    <Link
                      href={`/products/${alternative.productId}`}
                      className="block rounded-2xl border border-hairline p-4 transition hover:border-sage/35 hover:bg-linen/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-graphite">{alternative.name}</p>
                          <p className="mt-0.5 text-xs text-graphite-70">{alternative.brand ?? "Unbranded"}</p>
                        </div>
                        <span className="shrink-0 rounded-full bg-sage-soft px-2.5 py-1 font-data text-[10px] font-semibold text-sage">
                          {alternative.healthScore}/100
                        </span>
                      </div>
                      <p className="mt-3 font-data text-[10px] text-graphite-70">
                        Nutrition match {alternative.nutritionSimilarityPct}% · Ingredient match {alternative.tasteSimilarityPct}%
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </div>
    </main>
  );
}
