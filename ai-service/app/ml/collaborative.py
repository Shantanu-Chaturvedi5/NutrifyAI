"""
"People Like You" — user-based collaborative filtering. Similarity is
computed from shared health profile attributes (conditions, goals, age,
activity level, dietary preference), not from purchase/rating patterns
alone — with the data volume a project like this actually has, profile
similarity is a far stronger signal than the sparse rating overlap a
classic user-item CF model would need to work well.

Recommendations come from products that similar users rated highly
(healthiness_rating >= 4), weighted by how similar each rater is,
excluding anything the target user already rated.
"""

from app.db.pool import get_pool

SIMILARITY_THRESHOLD = 0.15
TOP_N_SIMILAR_USERS = 25
TOP_N_RECOMMENDATIONS = 10


async def get_people_like_you_recommendations(user_id: int) -> list[dict]:
    pool = await get_pool()
    async with pool.acquire() as conn:
        target = await _fetch_user_attributes(conn, user_id)
        if target is None:
            return []

        others = await _fetch_all_other_user_attributes(conn, user_id)
        if not others:
            return []

        scored_others = []
        for other in others:
            similarity = _similarity(target, other)
            if similarity >= SIMILARITY_THRESHOLD:
                scored_others.append((other["user_id"], similarity, other))

        if not scored_others:
            return []

        scored_others.sort(key=lambda x: x[1], reverse=True)
        top_similar = scored_others[:TOP_N_SIMILAR_USERS]
        similarity_by_user = {uid: sim for uid, sim, _ in top_similar}

        already_rated = await conn.fetch(
            "SELECT product_id FROM ratings WHERE user_id = $1", user_id
        )
        already_rated_ids = {r["product_id"] for r in already_rated}

        rows = await conn.fetch(
            """
            SELECT r.user_id, r.product_id, r.healthiness_rating, p.name, p.brand
            FROM ratings r
            JOIN products p ON p.id = r.product_id
            WHERE r.user_id = ANY($1::bigint[]) AND r.healthiness_rating >= 4
            """,
            list(similarity_by_user.keys()),
        )

        product_scores: dict[int, dict] = {}
        for row in rows:
            if row["product_id"] in already_rated_ids:
                continue
            weight = similarity_by_user[row["user_id"]] * (row["healthiness_rating"] / 5.0)
            entry = product_scores.setdefault(row["product_id"], {
                "productId": row["product_id"],
                "name": row["name"],
                "brand": row["brand"],
                "score": 0.0,
                "raterCount": 0,
            })
            entry["score"] += weight
            entry["raterCount"] += 1

        ranked = sorted(product_scores.values(), key=lambda p: p["score"], reverse=True)[:TOP_N_RECOMMENDATIONS]

        shared_conditions = target["conditions"] & _union_conditions(top_similar)
        for item in ranked:
            item["score"] = round(item["score"], 3)
            item["reasoning"] = _build_reasoning(target, shared_conditions)

        return ranked


def _union_conditions(scored_others: list[tuple[int, float, dict]]) -> set[str]:
    result: set[str] = set()
    for _, _, other in scored_others:
        result |= other["conditions"]
    return result


def _build_reasoning(target: dict, shared_conditions: set[str]) -> str:
    parts = []
    if target["goals"]:
        parts.append(f"shared goals ({', '.join(sorted(target['goals']))})")
    if shared_conditions:
        parts.append(f"similar health conditions ({', '.join(sorted(shared_conditions))})")
    if not parts:
        return "Liked by users with a similar health profile."
    return "Liked by users with " + " and ".join(parts) + "."


async def _fetch_user_attributes(conn, user_id: int) -> dict | None:
    profile = await conn.fetchrow(
        "SELECT age, activity_level, dietary_preference FROM health_profiles WHERE user_id = $1",
        user_id,
    )
    if profile is None:
        return None

    conditions = await conn.fetch(
        """
        SELECT mc.code FROM user_medical_conditions umc
        JOIN medical_conditions mc ON mc.id = umc.condition_id
        WHERE umc.user_id = $1
        """,
        user_id,
    )
    goals = await conn.fetch(
        """
        SELECT hg.code FROM user_health_goals uhg
        JOIN health_goals hg ON hg.id = uhg.goal_id
        WHERE uhg.user_id = $1 AND uhg.is_active = true
        """,
        user_id,
    )

    return {
        "user_id": user_id,
        "age": profile["age"],
        "activity_level": profile["activity_level"],
        "dietary_preference": profile["dietary_preference"],
        "conditions": {r["code"] for r in conditions},
        "goals": {r["code"] for r in goals},
    }


async def _fetch_all_other_user_attributes(conn, exclude_user_id: int) -> list[dict]:
    profiles = await conn.fetch(
        "SELECT user_id, age, activity_level, dietary_preference FROM health_profiles WHERE user_id != $1",
        exclude_user_id,
    )

    conditions_rows = await conn.fetch(
        """
        SELECT umc.user_id, mc.code FROM user_medical_conditions umc
        JOIN medical_conditions mc ON mc.id = umc.condition_id
        """
    )
    goals_rows = await conn.fetch(
        """
        SELECT uhg.user_id, hg.code FROM user_health_goals uhg
        JOIN health_goals hg ON hg.id = uhg.goal_id
        WHERE uhg.is_active = true
        """
    )

    conditions_by_user: dict[int, set[str]] = {}
    for r in conditions_rows:
        conditions_by_user.setdefault(r["user_id"], set()).add(r["code"])

    goals_by_user: dict[int, set[str]] = {}
    for r in goals_rows:
        goals_by_user.setdefault(r["user_id"], set()).add(r["code"])

    return [
        {
            "user_id": p["user_id"],
            "age": p["age"],
            "activity_level": p["activity_level"],
            "dietary_preference": p["dietary_preference"],
            "conditions": conditions_by_user.get(p["user_id"], set()),
            "goals": goals_by_user.get(p["user_id"], set()),
        }
        for p in profiles
    ]


def _similarity(a: dict, b: dict) -> float:
    condition_sim = _jaccard(a["conditions"], b["conditions"])
    goal_sim = _jaccard(a["goals"], b["goals"])

    if a["age"] is not None and b["age"] is not None:
        age_sim = 1.0 / (1.0 + abs(a["age"] - b["age"]) / 10.0)
    else:
        age_sim = 0.5

    activity_sim = 1.0 if a["activity_level"] == b["activity_level"] and a["activity_level"] is not None else 0.0
    diet_sim = 1.0 if a["dietary_preference"] == b["dietary_preference"] and a["dietary_preference"] is not None else 0.0

    return (
        0.35 * condition_sim
        + 0.35 * goal_sim
        + 0.15 * age_sim
        + 0.10 * activity_sim
        + 0.05 * diet_sim
    )


def _jaccard(a: set, b: set) -> float:
    union = a | b
    if not union:
        return 0.0
    return len(a & b) / len(union)
