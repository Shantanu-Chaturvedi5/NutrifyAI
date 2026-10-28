"""
Seeds the `products` / `product_nutrition` / `product_ingredients` tables
from Open Food Facts (https://openfoodfacts.org), so the product search,
scanner lookups, and personalized-scoring screens have real data to work
with out of the box.

Why Open Food Facts and not a static CSV (e.g. a Kaggle dataset): it's a
free, public, no-auth-required API that already matches this schema
closely — barcode, brand, category, ingredient list, and per-100g
nutrition (calories/protein/fat/sugar/fiber/sodium/etc.) for millions of
real branded products — so there's no manual download, cleanup, or
column-mapping guesswork involved. Data is community-contributed and
licensed under ODbL; attribution: https://world.openfoodfacts.org.

This pulls a curated spread of categories (not the whole database — that's
several GB) relevant to what this app's users actually scan/search:
packaged snacks, staples, and drinks. It tries India-specific results
first (`countries_tags_en=India`) since coverage skews toward whichever
market contributed the product, falling back to worldwide results for any
category that comes back too thin.

Idempotent per-product: re-running tops up new categories/products without
duplicating anything already seeded (products.barcode is UNIQUE, and we
skip products without a barcode entirely since barcode lookup is a core
feature here).

Run with:  python -m app.catalog.seed_products
"""

import asyncio

import httpx

from app.db.pool import close_pool, get_pool

OFF_SEARCH_URL = "https://world.openfoodfacts.org/api/v2/search"
USER_AGENT = "Nouriq-CatalogSeeder/1.0 (portfolio project; contact via repo)"

# (Open Food Facts category query term, our app's display category)
#
# Grouped by what people actually type into a food-nutrition search bar —
# not just snacks. Some of these OFF category tags will come back thin or
# empty depending on OFF's regional coverage; that's fine, _fetch_category
# already degrades gracefully (falls back to worldwide, then to 0 results)
# rather than treating a miss as an error.
CATEGORIES: list[tuple[str, str]] = [
    # Snacks
    ("chips", "Chips & Savory Snacks"),
    ("crisps", "Chips & Savory Snacks"),
    ("namkeen", "Chips & Savory Snacks"),
    ("popcorns", "Chips & Savory Snacks"),
    ("biscuits", "Biscuits & Cookies"),
    ("cookies", "Biscuits & Cookies"),
    ("chocolates", "Chocolate & Confectionery"),
    ("candies", "Chocolate & Confectionery"),
    ("granola bars", "Protein & Energy Bars"),
    ("protein bars", "Protein & Energy Bars"),

    # Fresh produce
    ("fruits", "Fresh Fruits & Vegetables"),
    ("bananas", "Fresh Fruits & Vegetables"),
    ("vegetables", "Fresh Fruits & Vegetables"),
    ("dried fruits", "Nuts & Dry Fruits"),
    ("nuts", "Nuts & Dry Fruits"),

    # Dairy & eggs
    ("yogurts", "Dairy & Yogurt"),
    ("milks", "Dairy & Yogurt"),
    ("cheeses", "Dairy & Yogurt"),
    ("butters", "Dairy & Yogurt"),
    ("paneer", "Dairy & Yogurt"),
    ("eggs", "Eggs, Meat & Fish"),

    # Grains, flours & pulses (Indian kitchen staples)
    ("rices", "Grains, Flours & Pulses"),
    ("flours", "Grains, Flours & Pulses"),
    ("pastas", "Grains, Flours & Pulses"),
    ("lentils", "Grains, Flours & Pulses"),
    ("breakfast cereals", "Breakfast Cereals"),
    ("breads", "Bread & Bakery"),
    ("cakes", "Bread & Bakery"),

    # Oils, condiments & spreads
    ("vegetable oils", "Cooking Oils & Ghee"),
    ("honeys", "Spreads & Condiments"),
    ("jams", "Spreads & Condiments"),
    ("peanut butters", "Spreads & Condiments"),
    ("ketchups", "Sauces & Condiments"),
    ("sauces", "Sauces & Condiments"),
    ("pickles", "Sauces & Condiments"),

    # Beverages
    ("sodas", "Beverages"),
    ("fruit juices", "Juices"),
    ("teas", "Tea & Coffee"),
    ("coffees", "Tea & Coffee"),
    ("waters", "Beverages"),
    ("energy drinks", "Beverages"),

    # Frozen, ready-to-eat & meat
    ("instant noodles", "Noodles & Instant Meals"),
    ("frozen foods", "Frozen & Ready Meals"),
    ("soups", "Frozen & Ready Meals"),
    ("meats", "Eggs, Meat & Fish"),
    ("fishes", "Eggs, Meat & Fish"),

    # Desserts & baby food
    ("ice cream", "Ice Cream & Desserts"),
    ("baby foods", "Baby Food"),
]

PAGE_SIZE = 40
FIELDS = ",".join([
    "code", "product_name", "product_name_en", "brands",
    "image_url", "serving_size", "categories",
    "ingredients_text", "ingredients_text_en", "allergens_tags",
    "nutriments",
])
REQUEST_DELAY_SECONDS = 1.0  # be polite to OFF's shared infrastructure
MIN_RESULTS_BEFORE_COUNTRY_FALLBACK = 5


def _split_ingredients(text: str) -> list[str]:
    """Top-level comma split, ignoring commas nested inside (...) or [...]
    (OFF ingredient strings look like 'Rice Noodles (rice, water), salt').
    Heuristic, not a real ingredient parser — good enough for seed data."""
    parts: list[str] = []
    depth = 0
    current = []
    for ch in text:
        if ch in "([":
            depth += 1
            current.append(ch)
        elif ch in ")]":
            depth = max(0, depth - 1)
            current.append(ch)
        elif ch == "," and depth == 0:
            parts.append("".join(current).strip())
            current = []
        else:
            current.append(ch)
    if current:
        parts.append("".join(current).strip())
    return [p for p in (p.strip(" .") for p in parts) if p]


def _allergen_keywords(allergens_tags: list[str]) -> list[str]:
    # "en:sesame-seeds" -> "sesame seeds"
    return [tag.split(":", 1)[-1].replace("-", " ") for tag in allergens_tags]


def _clamp_numeric(value: float | None, max_digits: int, scale: int = 2) -> float | None:
    """Match a Postgres NUMERIC(max_digits, scale) column's actual limit and
    drop anything that would overflow it, rather than letting a single bad
    upstream value (OFF is crowd-sourced — unit-entry mistakes happen, e.g.
    sodium logged in g where the field expects mg) crash the whole insert.
    Returns None for out-of-range values instead of raising."""
    if value is None:
        return None
    rounded = round(value, scale)
    limit = 10 ** (max_digits - scale)  # NUMERIC(8,2) -> must be < 10**6
    if abs(rounded) >= limit:
        return None
    return rounded


def _to_mg(value_g, max_digits: int) -> float | None:
    if value_g is None:
        return None
    try:
        return _clamp_numeric(float(value_g) * 1000, max_digits)
    except (TypeError, ValueError):
        return None


def _to_num(value, max_digits: int) -> float | None:
    if value is None:
        return None
    try:
        return _clamp_numeric(float(value), max_digits)
    except (TypeError, ValueError):
        return None


async def _fetch_category(client: httpx.AsyncClient, off_query: str) -> list[dict]:
    async def _search(with_country: bool) -> list[dict]:
        params = {
            "categories_tags_en": off_query,
            "page_size": str(PAGE_SIZE),
            "sort_by": "unique_scans_n",
            "fields": FIELDS,
        }
        if with_country:
            params["countries_tags_en"] = "India"

        # OFF's shared infra returns transient 503s under load — worth one
        # short retry before giving up on a category entirely.
        last_exc: Exception | None = None
        for attempt in range(2):
            try:
                resp = await client.get(OFF_SEARCH_URL, params=params, timeout=30.0)
                resp.raise_for_status()
                return resp.json().get("products", [])
            except httpx.HTTPStatusError as exc:
                last_exc = exc
                if exc.response.status_code == 503 and attempt == 0:
                    await asyncio.sleep(3.0)
                    continue
                raise
        raise last_exc  # pragma: no cover — unreachable, satisfies type checkers

    try:
        india_results = await _search(with_country=True)
    except httpx.HTTPError as exc:
        print(f"  [warn] India-filtered search failed for '{off_query}': {exc}")
        india_results = []

    if len(india_results) >= MIN_RESULTS_BEFORE_COUNTRY_FALLBACK:
        return india_results

    try:
        world_results = await _search(with_country=False)
    except httpx.HTTPError as exc:
        print(f"  [warn] Worldwide search failed for '{off_query}': {exc}")
        return india_results

    # Merge, preferring India results first, deduped by barcode.
    seen = {p.get("code") for p in india_results}
    merged = list(india_results) + [p for p in world_results if p.get("code") not in seen]
    return merged


def _parse_product(raw: dict, app_category: str, off_query: str) -> dict | None:
    barcode = (raw.get("code") or "").strip()
    if not barcode:
        return None

    name = (raw.get("product_name_en") or raw.get("product_name") or "").strip()
    if not name:
        return None

    # OFF's categories_tags_en filter isn't perfectly reliable — it's a
    # crowd-sourced taxonomy, and mistagged products slip through (a soda
    # showing up under "yogurts" is exactly this). Cross-check the
    # product's OWN full category list actually mentions what we searched
    # for before trusting the filter — cheap, and catches the obvious
    # cross-category contamination cases even if it's not foolproof.
    categories_str = (raw.get("categories") or "").lower()
    query_normalized = off_query.lower().replace("-", " ")
    if query_normalized not in categories_str:
        return None

    brands = (raw.get("brands") or "").strip()
    brand = brands.split(",")[0].strip() if brands else None

    nutriments = raw.get("nutriments") or {}
    # max_digits mirrors each column's NUMERIC(precision, 2) in docs/schema.sql
    calories = _to_num(nutriments.get("energy-kcal_100g"), max_digits=8)
    protein_g = _to_num(nutriments.get("proteins_100g"), max_digits=6)
    fat_g = _to_num(nutriments.get("fat_100g"), max_digits=6)
    saturated_fat_g = _to_num(nutriments.get("saturated-fat_100g"), max_digits=6)
    carbs_g = _to_num(nutriments.get("carbohydrates_100g"), max_digits=6)
    sugar_g = _to_num(nutriments.get("sugars_100g"), max_digits=6)
    fiber_g = _to_num(nutriments.get("fiber_100g"), max_digits=6)
    sodium_mg = _to_mg(nutriments.get("sodium_100g"), max_digits=8)
    cholesterol_mg = _to_mg(nutriments.get("cholesterol_100g"), max_digits=8)

    # Require at least calories, or the product is useless for scoring.
    if calories is None:
        return None

    ingredients_text = (raw.get("ingredients_text_en") or raw.get("ingredients_text") or "").strip()
    allergen_keywords = _allergen_keywords(raw.get("allergens_tags") or [])
    ingredients: list[dict] = []
    for i, ing_name in enumerate(_split_ingredients(ingredients_text)[:20], start=1):
        is_allergen = any(kw and kw.lower() in ing_name.lower() for kw in allergen_keywords)
        ingredients.append({
            "name": ing_name[:150],
            "position": i,
            "is_allergen": is_allergen,
        })

    return {
        "barcode": barcode,
        "name": name[:255],
        "brand": brand[:255] if brand else None,
        "category": app_category,
        "image_url": raw.get("image_url") or None,
        "nutrition": {
            "serving_size": (raw.get("serving_size") or None),
            "calories": calories,
            "protein_g": protein_g,
            "fat_g": fat_g,
            "saturated_fat_g": saturated_fat_g,
            "carbs_g": carbs_g,
            "sugar_g": sugar_g,
            "fiber_g": fiber_g,
            "sodium_mg": sodium_mg,
            "cholesterol_mg": cholesterol_mg,
        },
        "ingredients": ingredients,
    }


async def _insert_product(conn, product: dict) -> bool:
    """Returns True if inserted, False if it already existed (skipped).
    Runs as one transaction so a failure partway through (e.g. an
    unanticipated data shape) can't leave a product row with no nutrition
    or a half-written ingredient list — either the whole product lands, or
    none of it does."""
    async with conn.transaction():
        product_id = await conn.fetchval(
            """
            INSERT INTO products (barcode, name, brand, category, image_url, source)
            VALUES ($1, $2, $3, $4, $5, 'CATALOG')
            ON CONFLICT (barcode) DO NOTHING
            RETURNING id
            """,
            product["barcode"], product["name"], product["brand"],
            product["category"], product["image_url"],
        )
        if product_id is None:
            return False

        n = product["nutrition"]
        await conn.execute(
            """
            INSERT INTO product_nutrition
                (product_id, serving_size, calories, protein_g, fat_g, saturated_fat_g,
                 carbs_g, sugar_g, fiber_g, sodium_mg, cholesterol_mg)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            """,
            product_id, n["serving_size"], n["calories"], n["protein_g"], n["fat_g"],
            n["saturated_fat_g"], n["carbs_g"], n["sugar_g"], n["fiber_g"],
            n["sodium_mg"], n["cholesterol_mg"],
        )

        for ing in product["ingredients"]:
            await conn.execute(
                """
                INSERT INTO product_ingredients (product_id, ingredient_name, position, is_allergen)
                VALUES ($1, $2, $3, $4)
                """,
                product_id, ing["name"], ing["position"], ing["is_allergen"],
            )

        return True


async def main() -> None:
    pool = await get_pool()
    inserted = 0
    skipped_duplicate = 0
    skipped_incomplete = 0
    skipped_error = 0

    async with httpx.AsyncClient(headers={"User-Agent": USER_AGENT}) as client:
        for off_query, app_category in CATEGORIES:
            print(f"Fetching '{off_query}' -> {app_category} ...")
            raw_products = await _fetch_category(client, off_query)
            print(f"  {len(raw_products)} raw results")

            async with pool.acquire() as conn:
                for raw in raw_products:
                    parsed = _parse_product(raw, app_category, off_query)
                    if parsed is None:
                        skipped_incomplete += 1
                        continue
                    try:
                        was_inserted = await _insert_product(conn, parsed)
                    except Exception as exc:  # noqa: BLE001 — one bad product must not kill the run
                        print(f"  [warn] skipped '{parsed['name'][:60]}' ({parsed['barcode']}): {exc}")
                        skipped_error += 1
                        continue
                    if was_inserted:
                        inserted += 1
                    else:
                        skipped_duplicate += 1

            await asyncio.sleep(REQUEST_DELAY_SECONDS)

    await close_pool()
    print(
        f"\nDone — inserted {inserted} products "
        f"({skipped_duplicate} already existed, {skipped_incomplete} skipped "
        f"for missing name/barcode/calories, {skipped_error} skipped on "
        f"insert error)."
    )


if __name__ == "__main__":
    asyncio.run(main())