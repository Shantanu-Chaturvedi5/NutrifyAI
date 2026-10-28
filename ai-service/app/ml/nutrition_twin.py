"""
Nutrition Twin: turns a user's history of report_extracted_values into a
trend summary and a simple forward projection per parameter. Deliberately
deterministic (plain linear regression via numpy, no LLM) — a "risk
prediction" feature should be numerically traceable, not narrated by a
model that could hallucinate a trend that isn't in the data.

The risk narrative also checks the user's active health goals (same
user_health_goals data used elsewhere for personalization) and calls out
when a trending parameter works against one — but only for pairings with
a real clinical relationship (e.g. rising LDL vs. a heart-health goal).
It does not attempt this for goals like weight/muscle targets, since
nothing in a standard lab panel tracks those.

This is a straightforward trend line, not a validated clinical risk
model — framed and labeled as such wherever it's surfaced.
"""

from datetime import date

import json

import numpy as np

from app.db.pool import get_pool

PROJECTION_HORIZON_DAYS = 90
MIN_POINTS_FOR_TREND = 2


async def generate_nutrition_twin(user_id: int) -> dict:
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT rev.parameter_name, rev.value, rev.status, mr.uploaded_at::date AS report_date
            FROM report_extracted_values rev
            JOIN medical_reports mr ON mr.id = rev.report_id
            WHERE mr.user_id = $1 AND rev.value IS NOT NULL
            ORDER BY rev.parameter_name, mr.uploaded_at
            """,
            user_id,
        )

        # Active goals feed the risk narrative below — same user_health_goals
        # table HealthContextService reads for product/report personalization,
        # queried directly here since ai-service already talks to this DB
        # for the report-value query above.
        goal_rows = await conn.fetch(
            """
            SELECT hg.code, hg.name
            FROM user_health_goals uhg
            JOIN health_goals hg ON hg.id = uhg.goal_id
            WHERE uhg.user_id = $1 AND uhg.is_active = TRUE
            """,
            user_id,
        )
        active_goals = {r["code"]: r["name"] for r in goal_rows}

        by_parameter: dict[str, list[tuple[date, float, str]]] = {}
        for r in rows:
            by_parameter.setdefault(r["parameter_name"], []).append(
                (r["report_date"], float(r["value"]), r["status"])
            )

        trend_series = {}
        risk_predictions = []
        deficient_params = []

        for parameter, points in by_parameter.items():
            trend_series[parameter] = [{"date": d.isoformat(), "value": v} for d, v, _ in points]

            latest_status = points[-1][2]
            if latest_status in ("DEFICIENT", "LOW", "HIGH", "CRITICAL"):
                deficient_params.append((parameter, latest_status))

            if len(points) < MIN_POINTS_FOR_TREND:
                continue

            prediction = _project(points)
            if prediction is not None:
                prediction["metric"] = parameter
                risk_predictions.append(prediction)

        health_trend_summary = _summarize_trends(risk_predictions)
        deficiency_trend_summary = _summarize_deficiencies(deficient_params)
        risk_prediction_summary = _summarize_risks(risk_predictions, active_goals)

        snapshot_date = date.today()
        await conn.execute(
            """
            INSERT INTO nutrition_twin_snapshots
                (user_id, snapshot_date, health_trend_summary, deficiency_trend_summary,
                 risk_prediction_summary, detail_json)
            VALUES ($1, $2, $3, $4, $5, $6::jsonb)
            ON CONFLICT (user_id, snapshot_date) DO UPDATE SET
                health_trend_summary = EXCLUDED.health_trend_summary,
                deficiency_trend_summary = EXCLUDED.deficiency_trend_summary,
                risk_prediction_summary = EXCLUDED.risk_prediction_summary,
                detail_json = EXCLUDED.detail_json
            """,
            user_id, snapshot_date, health_trend_summary, deficiency_trend_summary,
            risk_prediction_summary,
            json.dumps({"trendSeries": trend_series, "riskPredictions": risk_predictions}),
        )

    return {
        "snapshotDate": snapshot_date.isoformat(),
        "healthTrendSummary": health_trend_summary,
        "deficiencyTrendSummary": deficiency_trend_summary,
        "riskPredictionSummary": risk_prediction_summary,
    }


def _project(points: list[tuple[date, float, str]]) -> dict | None:
    base_date = points[0][0]
    x = np.array([(d - base_date).days for d, _, _ in points], dtype=float)
    y = np.array([v for _, v, _ in points], dtype=float)

    if np.all(x == x[0]):
        return None

    slope, intercept = np.polyfit(x, y, 1)

    latest_value = y[-1]
    latest_day = x[-1]
    projected_day = latest_day + PROJECTION_HORIZON_DAYS
    projected_value = slope * projected_day + intercept

    if latest_value == 0:
        return None

    change_pct = round(((projected_value - latest_value) / abs(latest_value)) * 100, 1)

    return {
        "metric": None,  # attached by the caller, which knows the parameter name
        "currentValue": round(latest_value, 2),
        "projectedValue": round(float(projected_value), 2),
        "projectedChangePct": change_pct,
        "horizonDays": PROJECTION_HORIZON_DAYS,
        "basis": f"linear trend across {len(points)} reports",
    }


def _summarize_trends(risk_predictions: list[dict]) -> str:
    if not risk_predictions:
        return "Not enough report history yet to identify trends — upload another report to start tracking changes over time."
    moving = [p for p in risk_predictions if abs(p["projectedChangePct"]) >= 5]
    if not moving:
        return "Your tracked values have been stable across your report history."
    parts = [f"{p['metric']} trending {'up' if p['projectedChangePct'] > 0 else 'down'} ({p['projectedChangePct']}% projected over {p['horizonDays']} days)" for p in moving[:3]]
    return "Notable trends: " + "; ".join(parts) + "."


def _summarize_deficiencies(deficient_params: list[tuple[str, str]]) -> str:
    if not deficient_params:
        return "No current deficiencies or out-of-range values in your most recent reports."
    parts = [f"{name} ({status.lower()})" for name, status in deficient_params]
    return "Currently flagged: " + ", ".join(parts) + "."


def _summarize_risks(risk_predictions: list[dict], active_goals: dict[str, str]) -> str:
    significant = [p for p in risk_predictions if abs(p["projectedChangePct"]) >= 10]
    if not significant:
        return "No parameter is projected to change significantly based on current trends."

    parts = []
    for p in significant[:3]:
        direction = "up" if p["projectedChangePct"] > 0 else "down"
        base = (
            f"current dietary/health pattern may move {p['metric']} by "
            f"{p['projectedChangePct']}% over the next {p['horizonDays']} days if it continues"
        )
        goal_note = _goal_conflict_note(p["metric"], direction, active_goals)
        parts.append(base + goal_note)

    return " ".join(parts) + " — this is a simple trend projection, not a clinical risk assessment."


# Parameter name (matched as a case-insensitive substring against the
# extracted parameterName) -> which active goal(s) this is relevant to,
# and which trend direction works against that goal. Deliberately narrow:
# only pairs with a real, defensible clinical relationship are included —
# e.g. no attempt to connect a lab value to WEIGHT_LOSS or MUSCLE_GAIN,
# since standard blood/urine panels don't contain a parameter that
# meaningfully tracks either.
_GOAL_RELEVANT_PARAMETERS: dict[str, list[tuple[str, str]]] = {
    "ldl": [("HEART_HEALTH", "up")],
    "total cholesterol": [("HEART_HEALTH", "up")],
    "triglyceride": [("HEART_HEALTH", "up")],
    "hdl": [("HEART_HEALTH", "down")],
    "non-hdl": [("HEART_HEALTH", "up")],
    "blood sugar": [("BLOOD_SUGAR_CONTROL", "up")],
    "hba1c": [("BLOOD_SUGAR_CONTROL", "up")],
    "glucose": [("BLOOD_SUGAR_CONTROL", "up")],
}


def _goal_conflict_note(metric: str, direction: str, active_goals: dict[str, str]) -> str:
    metric_lower = metric.lower()
    for key, goal_rules in _GOAL_RELEVANT_PARAMETERS.items():
        if key not in metric_lower:
            continue
        for goal_code, bad_direction in goal_rules:
            if goal_code in active_goals and direction == bad_direction:
                return f" — this may work against your {active_goals[goal_code]} goal"
    return ""