from fastapi import APIRouter

from app.schemas.ai import AIStatus
from app.services.ai.factory import get_ai_provider

router = APIRouter(prefix="/ai", tags=["ai"])


@router.get("/status", response_model=AIStatus)
def ai_status() -> AIStatus:
    """Lets the frontend know whether AI features are usable right now,
    so it can show "AI unavailable" UI instead of a broken chat."""
    provider = get_ai_provider()
    return AIStatus(configured=provider.name != "none", provider=provider.name)
