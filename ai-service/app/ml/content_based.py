"""
Content-based "Smart Alternative Recommendation Engine" — nutrition
similarity via cosine similarity over a scaled nutrition vector, taste
similarity as an ingredient-overlap proxy (no real taste/flavor data
exists to model this properly yet), and a simple health-score heuristic
for ranking. All three numbers are genuinely computed, not placeholders —
but the health score in particular is explicitly a heuristic, not the
personalized, condition-aware suitability score described in the original
spec (that's a separate, not-yet-built feature: it needs a user's health
profile as input, not just the product).
"""

import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import StandardScaler

from app.db.pool import get_pool

NUTRITION_FIELDS = ["calories", "protein_g", "fat_g", "carbs_g", "sugar_g", "fiber_g", "sodium_mg"]


async def recompute_alternatives_for_category(category: str, top_n: int = 3) -> int:
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT p.id, pn.calories, pn.protein_g, pn.fat_g, pn.carbs_g, pn.sugar_g, pn.fiber_g, pn.sodium_mg
            FROM products p
            JOIN product_nutrition pn ON pn.product_id = p.id
            WHERE p.category = $1
            """,
            category,
        )

        if len(rows) < 2:
            return 0

        ids = [r["id"] for r in rows]
        matrix = np.array([[float(r[f] or 0) for f in NUTRITION_FIELDS] for r in rows])
        scaled = StandardScaler().fit_transform(matrix)
        similarity = cosine_similarity(scaled)

        ingredient_sets = await _fetch_ingredient_sets(conn, ids)
        health_scores = {pid: await _health_score(conn, pid) for pid in ids}

        async with conn.transaction():
            for i, product_id in enumerate(ids):
                await conn.execute("DELETE FROM product_alternatives WHERE product_id = $1", product_id)

                ranked = sorted(
                    ((j, similarity[i][j]) for j in range(len(ids)) if j != i),
                    key=lambda pair: pair[1],
                    reverse=True,
                )[:top_n]

                for rank, (j, sim) in enumerate(ranked, start=1):
                    alt_id = ids[j]
                    nutrition_pct = int(max(0, min(100, round(sim * 100))))
                    taste_pct = int(round(
                        _jaccard(ingredient_sets.get(product_id, set()), ingredient_sets.get(alt_id, set())) * 100
                    ))

                    await conn.execute(
                        """
                        INSERT INTO product_alternatives
                            (product_id, alternative_product_id, nutrition_similarity_pct,
                             taste_similarity_pct, health_score, rank)
                        VALUES ($1, $2, $3, $4, $5, $6)
                        """,
                        product_id, alt_id, nutrition_pct, taste_pct, health_scores[alt_id], rank,
                    )

        return len(ids)


async def _fetch_ingredient_sets(conn, product_ids: list[int]) -> dict[int, set[str]]:
    rows = await conn.fetch(
        "SELECT product_id, ingredient_name FROM product_ingredients WHERE product_id = ANY($1::bigint[])",
        product_ids,
    )
    sets: dict[int, set[str]] = {}
    for r in rows:
        sets.setdefault(r["product_id"], set()).add(r["ingredient_name"].lower())
    return sets


def _jaccard(a: set, b: set) -> float:
    union = a | b
    if not union:
        return 0.0
    return len(a & b) / len(union)


async def _health_score(conn, product_id: int) -> int:
    """
    Heuristic 0-100 score used only to rank/display alternatives: rewards
    fiber and protein, penalizes sugar and sodium relative to calories.
    Not a clinical assessment and not personalized to any user.
    """
    row = await conn.fetchrow(
        "SELECT calories, sugar_g, fiber_g, protein_g, sodium_mg FROM product_nutrition WHERE product_id = $1",
        product_id,
    )
    if not row or not row["calories"]:
        return 50

    calories = float(row["calories"]) or 1.0
    sugar = float(row["sugar_g"] or 0)
    fiber = float(row["fiber_g"] or 0)
    protein = float(row["protein_g"] or 0)
    sodium = float(row["sodium_mg"] or 0)

    score = 50.0
    score += min(20.0, fiber * 2)
    score += min(20.0, protein)
    score -= min(25.0, (sugar / calories) * 100)
    score -= min(15.0, (sodium / 2300.0) * 15)

    return int(max(0, min(100, round(score))))
