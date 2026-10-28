"""
Seeds a small hand-curated set of common fresh fruits and vegetables.

Why this exists separately from seed_products.py: Open Food Facts is a
barcode-scanning database, built around packaged/branded goods. Loose
produce almost never carries a barcode, so OFF's actual coverage of
something as basic as "banana" is tiny (its own `bananas` category lists
well under a hundred products worldwide, many labeled in French rather
than English) — pulling more OFF category names doesn't fix that, the
data just isn't really there.

These entries use `source = 'MANUAL'` and no barcode (nutrition figures
are standard, widely-published per-100g values — the same numbers you'd
find in any nutrition reference, not scraped from a specific source).
Same "not clinical-grade" caveat as the rest of this project's seed data.

Idempotent by name (no barcode to dedupe on): re-running skips any name
that already exists as a MANUAL entry rather than creating duplicates.

Run with:  python -m app.catalog.seed_fresh_produce
"""

import asyncio

from app.db.pool import close_pool, get_pool

# name, calories, protein_g, fat_g, carbs_g, sugar_g, fiber_g, sodium_mg
# — standard per-100g raw/edible-portion figures.
FRESH_PRODUCE: list[tuple[str, float, float, float, float, float, float, float]] = [
    ("Banana", 89, 1.1, 0.3, 22.8, 12.2, 2.6, 1),
    ("Apple", 52, 0.3, 0.2, 13.8, 10.4, 2.4, 1),
    ("Orange", 47, 0.9, 0.1, 11.8, 9.4, 2.4, 0),
    ("Mango", 60, 0.8, 0.4, 15.0, 13.7, 1.6, 1),
    ("Grapes", 69, 0.7, 0.2, 18.1, 15.5, 0.9, 2),
    ("Watermelon", 30, 0.6, 0.2, 7.6, 6.2, 0.4, 1),
    ("Papaya", 43, 0.5, 0.3, 10.8, 7.8, 1.7, 8),
    ("Pomegranate", 83, 1.7, 1.2, 18.7, 13.7, 4.0, 3),
    ("Guava", 68, 2.6, 1.0, 14.3, 8.9, 5.4, 2),
    ("Pineapple", 50, 0.5, 0.1, 13.1, 9.9, 1.4, 1),
    ("Strawberry", 32, 0.7, 0.3, 7.7, 4.9, 2.0, 1),
    ("Lemon", 29, 1.1, 0.3, 9.3, 2.5, 2.8, 2),
    ("Avocado", 160, 2.0, 14.7, 8.5, 0.7, 6.7, 7),
    ("Coconut (fresh)", 354, 3.3, 33.5, 15.2, 6.2, 9.0, 20),
    ("Tomato", 18, 0.9, 0.2, 3.9, 2.6, 1.2, 5),
    ("Potato", 77, 2.0, 0.1, 17.5, 0.8, 2.2, 6),
    ("Sweet Potato", 86, 1.6, 0.1, 20.1, 4.2, 3.0, 55),
    ("Onion", 40, 1.1, 0.1, 9.3, 4.2, 1.7, 4),
    ("Garlic", 149, 6.4, 0.5, 33.1, 1.0, 2.1, 17),
    ("Ginger", 80, 1.8, 0.8, 17.8, 1.7, 2.0, 13),
    ("Spinach", 23, 2.9, 0.4, 3.6, 0.4, 2.2, 79),
    ("Carrot", 41, 0.9, 0.2, 9.6, 4.7, 2.8, 69),
    ("Cucumber", 15, 0.7, 0.1, 3.6, 1.7, 0.5, 2),
    ("Cauliflower", 25, 1.9, 0.3, 5.0, 1.9, 2.0, 30),
    ("Cabbage", 25, 1.3, 0.1, 5.8, 3.2, 2.5, 18),
    ("Broccoli", 34, 2.8, 0.4, 6.6, 1.7, 2.6, 33),
    ("Capsicum (Bell Pepper)", 31, 1.0, 0.3, 6.0, 4.2, 2.1, 4),
    ("Okra (Bhindi)", 33, 1.9, 0.2, 7.5, 1.5, 3.2, 7),
    ("Brinjal (Eggplant)", 25, 1.0, 0.2, 6.0, 3.5, 3.0, 2),
    ("Green Peas", 81, 5.4, 0.4, 14.5, 5.7, 5.7, 5),
]

APP_CATEGORY = "Fresh Fruits & Vegetables"


async def main() -> None:
    pool = await get_pool()
    inserted = 0
    skipped_duplicate = 0

    async with pool.acquire() as conn:
        for (name, calories, protein_g, fat_g, carbs_g, sugar_g, fiber_g, sodium_mg) in FRESH_PRODUCE:
            existing = await conn.fetchval(
                "SELECT id FROM products WHERE name = $1 AND source = 'MANUAL'",
                name,
            )
            if existing is not None:
                skipped_duplicate += 1
                continue

            async with conn.transaction():
                product_id = await conn.fetchval(
                    """
                    INSERT INTO products (name, category, source)
                    VALUES ($1, $2, 'MANUAL')
                    RETURNING id
                    """,
                    name, APP_CATEGORY,
                )
                await conn.execute(
                    """
                    INSERT INTO product_nutrition
                        (product_id, serving_size, calories, protein_g, fat_g,
                         carbs_g, sugar_g, fiber_g, sodium_mg)
                    VALUES ($1, '100 g', $2, $3, $4, $5, $6, $7, $8)
                    """,
                    product_id, calories, protein_g, fat_g, carbs_g, sugar_g, fiber_g, sodium_mg,
                )
                await conn.execute(
                    """
                    INSERT INTO product_ingredients (product_id, ingredient_name, position, is_allergen)
                    VALUES ($1, $2, 1, FALSE)
                    """,
                    product_id, name,
                )
            inserted += 1
            print(f"Seeded: {name}")

    await close_pool()
    print(f"\nDone — inserted {inserted} fresh produce items ({skipped_duplicate} already existed).")


if __name__ == "__main__":
    asyncio.run(main())