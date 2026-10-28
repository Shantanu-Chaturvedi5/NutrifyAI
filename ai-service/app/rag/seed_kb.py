"""
Seeds knowledge_base_chunks with a small starter set of general nutrition
facts, so the RAG chatbot has *something* to retrieve out of the box.

This is illustrative, not exhaustive or clinical-grade — expand it with
properly cited guidelines (ADA, AHA, NIH, etc.) before relying on it for
anything beyond a portfolio demo. Each entry here is written in plain
language from general nutrition science knowledge, not copied from any
single source.

Run with:  python -m app.rag.seed_kb
"""

import asyncio

from app.core.llm_provider import get_embeddings_model
from app.db.pool import close_pool, get_pool

ENTRIES: list[tuple[str, str]] = [
    (
        "General — fiber & blood sugar",
        "Soluble fiber slows glucose absorption, which helps blunt post-meal "
        "blood sugar spikes. Oats, legumes, and most vegetables are good "
        "sources, which is often relevant for people managing diabetes.",
    ),
    (
        "General — sodium & blood pressure",
        "Reducing sodium intake to roughly 1500-2300mg per day is a common "
        "recommendation for people managing high blood pressure, since "
        "excess sodium contributes to fluid retention and elevated blood "
        "pressure.",
    ),
    (
        "General — fat quality & heart health",
        "Replacing saturated fats such as butter and fatty red meat with "
        "unsaturated fats such as olive oil, nuts, and fish is generally "
        "associated with improved LDL cholesterol levels over time.",
    ),
    (
        "General — protein & muscle gain",
        "Muscle protein synthesis generally benefits from roughly 1.6 to "
        "2.2 grams of protein per kilogram of bodyweight per day when "
        "combined with regular resistance training.",
    ),
    (
        "General — vitamin D",
        "Vitamin D deficiency is common in people with limited sun "
        "exposure. Fatty fish, fortified dairy, and supplementation are "
        "typical ways to address low levels, usually confirmed via a blood "
        "test.",
    ),
    (
        "General — added sugar",
        "Most dietary guidelines suggest keeping added sugar under about "
        "10% of total daily calories, to reduce the risk of weight gain "
        "and metabolic issues over time.",
    ),
    (
        "PCOS — carbohydrate pairing",
        "Some people managing PCOS find that moderating refined "
        "carbohydrate intake, and pairing carbohydrates with protein or "
        "fat, helps with symptoms related to insulin resistance.",
    ),
    (
        "Kidney disease — protein & potassium",
        "People with advanced kidney disease are often advised to "
        "moderate protein and potassium intake, since impaired kidneys "
        "struggle to clear these efficiently. This varies significantly by "
        "disease stage and should be individualized with a doctor or "
        "renal dietitian.",
    ),
    (
        "General — hydration & appetite",
        "Drinking water before meals is a commonly cited strategy that may "
        "help some people naturally reduce calorie intake, though the "
        "evidence for a strong effect is modest.",
    ),
    (
        "General — iron absorption",
        "Iron deficiency is more common in menstruating individuals and in "
        "people eating vegetarian or vegan diets. Pairing plant-based iron "
        "sources with vitamin C can improve how much iron the body "
        "absorbs.",
    ),
]


async def main() -> None:
    embeddings = get_embeddings_model()
    pool = await get_pool()

    async with pool.acquire() as conn:
        existing = await conn.fetchval("SELECT count(*) FROM knowledge_base_chunks")
        if existing > 0:
            print(f"knowledge_base_chunks already has {existing} rows — skipping seed. "
                  f"Delete existing rows first if you want to reseed.")
            return

        for source, content in ENTRIES:
            vector = await asyncio.to_thread(embeddings.embed_query, content)
            await conn.execute(
                "INSERT INTO knowledge_base_chunks (source, content, embedding) VALUES ($1, $2, $3)",
                source, content, vector,
            )
            print(f"Seeded: {source}")

    await close_pool()
    print(f"Done — seeded {len(ENTRIES)} knowledge base entries.")


if __name__ == "__main__":
    asyncio.run(main())
