"""FastAPI application entrypoint."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.ai import router as ai_router
from app.api.routes.auth import router as auth_router
from app.api.routes.brands import router as brands_router
from app.api.routes.categories import router as categories_router
from app.api.routes.compare import router as compare_router
from app.api.routes.health import router as health_router
from app.api.routes.products import router as products_router
from app.core.config import get_settings
from app.core.errors import register_exception_handlers
from app.core.logging import configure_logging
from app.core.middleware import RequestIDMiddleware

settings = get_settings()
configure_logging()

_INSECURE_DEFAULT_JWT_SECRET = "dev-insecure-secret-change-me"
if settings.is_production and settings.jwt_secret == _INSECURE_DEFAULT_JWT_SECRET:
    raise RuntimeError("JWT_SECRET must be set to a secure value in production.")

app = FastAPI(
    title=settings.app_name,
    description="AI-powered shopping intelligence and product comparison platform.",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(RequestIDMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

register_exception_handlers(app)

app.include_router(health_router)
app.include_router(auth_router)
app.include_router(products_router)
app.include_router(brands_router)
app.include_router(categories_router)
app.include_router(compare_router)
app.include_router(ai_router)
