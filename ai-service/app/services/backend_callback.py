import httpx

from app.core.config import settings


async def send_report_analysis_result(
    report_id: int,
    success: bool,
    failure_reason: str | None,
    raw_extraction: dict,
    extracted_values: list[dict],
) -> None:
    url = f"{settings.BACKEND_CORE_URL}/internal/reports/{report_id}/analysis-result"

    body = {
        "success": success,
        "failureReason": failure_reason,
        "rawExtraction": raw_extraction,
        "extractedValues": extracted_values,
    }

    async with httpx.AsyncClient(timeout=15) as client:
        response = await client.post(
            url,
            json=body,
            headers={"X-Internal-Token": settings.AI_SERVICE_INTERNAL_TOKEN},
        )
        response.raise_for_status()


async def send_product_scan_result(
    scan_id: int,
    success: bool,
    failure_reason: str | None,
    extracted: dict | None,
) -> None:
    url = f"{settings.BACKEND_CORE_URL}/internal/product-scans/{scan_id}/analysis-result"

    body = {
        "success": success,
        "failureReason": failure_reason,
        "extracted": extracted,
    }

    async with httpx.AsyncClient(timeout=15) as client:
        response = await client.post(
            url,
            json=body,
            headers={"X-Internal-Token": settings.AI_SERVICE_INTERNAL_TOKEN},
        )
        response.raise_for_status()


async def send_diet_plan_result(
    plan_id: int,
    success: bool,
    failure_reason: str | None,
    day_templates: list[dict] | None,
) -> None:
    url = f"{settings.BACKEND_CORE_URL}/internal/diet-plans/{plan_id}/generation-result"

    body = {
        "success": success,
        "failureReason": failure_reason,
        "dayTemplates": day_templates,
    }

    async with httpx.AsyncClient(timeout=15) as client:
        response = await client.post(
            url,
            json=body,
            headers={"X-Internal-Token": settings.AI_SERVICE_INTERNAL_TOKEN},
        )
        response.raise_for_status()


async def send_restaurant_menu_result(
    menu_id: int,
    success: bool,
    failure_reason: str | None,
    restaurant_name_guess: str | None,
    items: list[dict] | None,
) -> None:
    url = f"{settings.BACKEND_CORE_URL}/internal/restaurant-menus/{menu_id}/analysis-result"

    body = {
        "success": success,
        "failureReason": failure_reason,
        "restaurantNameGuess": restaurant_name_guess,
        "items": items,
    }

    async with httpx.AsyncClient(timeout=15) as client:
        response = await client.post(
            url,
            json=body,
            headers={"X-Internal-Token": settings.AI_SERVICE_INTERNAL_TOKEN},
        )
        response.raise_for_status()