from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.core.config import settings
from app.db.pool import close_pool, get_pool
from app.api.v1.routers import report_analyzer, chatbot, recommend, nutrition_twin, personalization, collaborative, product_scanner, diet_plan, restaurant_menu
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse


@asynccontextmanager
async def lifespan(app: FastAPI):
    await get_pool()
    yield
    await close_pool()


app = FastAPI(
    title="Nouriq — AI/ML service",
    version="0.1.0",
    description=(
        "OCR, health report analysis, RAG chatbot, recommendation engine, "
        "and nutrition twin predictions. Internal service — only called by "
        "the Spring Boot core backend, never directly by the frontend."
    ),
    lifespan=lifespan,
)

@app.exception_handler(RequestValidationError)
async def log_validation_errors(request, exc):
    body = await request.body()
    print(f"VALIDATION FAILED on {request.url.path}: {exc.errors()} | raw body: {body}")
    return JSONResponse(status_code=422, content={"detail": exc.errors()})
app.include_router(report_analyzer.router, prefix="/api/v1/report-analyzer", tags=["report-analyzer"])
app.include_router(chatbot.router, prefix="/api/v1/chatbot", tags=["chatbot"])
app.include_router(recommend.router, prefix="/api/v1/recommend", tags=["recommend"])
app.include_router(nutrition_twin.router, prefix="/api/v1/nutrition-twin", tags=["nutrition-twin"])
app.include_router(personalization.router, prefix="/api/v1/personalize", tags=["personalization"])
app.include_router(collaborative.router, prefix="/api/v1/recommend", tags=["recommend"])
app.include_router(product_scanner.router, prefix="/api/v1/product-scanner", tags=["product-scanner"])
app.include_router(diet_plan.router, prefix="/api/v1/diet-plan-generator", tags=["diet-plan-generator"])
app.include_router(restaurant_menu.router, prefix="/api/v1/restaurant-menu-analyzer", tags=["restaurant-menu-analyzer"])


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "llm_provider": settings.LLM_PROVIDER,
    }