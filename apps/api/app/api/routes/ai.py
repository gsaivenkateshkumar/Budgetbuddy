from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.errors import AppError
from app.schemas.ai import AIStatus, ChatRequest, ChatResponse, ToolCallSummary
from app.services.ai.agent import run_agent_turn
from app.services.ai.factory import get_ai_provider
from app.services.ai.types import AIProviderError, ChatMessage, ChatRole

router = APIRouter(prefix="/ai", tags=["ai"])


@router.get("/status", response_model=AIStatus)
def ai_status() -> AIStatus:
    """Lets the frontend know whether AI features are usable right now,
    so it can show "AI unavailable" UI instead of a broken chat."""
    provider = get_ai_provider()
    return AIStatus(configured=provider.name != "none", provider=provider.name)


@router.post("/chat", response_model=ChatResponse)
async def ai_chat(request: ChatRequest, db: Session = Depends(get_db)) -> ChatResponse:
    provider = get_ai_provider()
    if provider.name == "none":
        raise AppError("AI is not configured on this server.", code="ai_not_configured", status_code=503)

    history = [
        ChatMessage(role=ChatRole.USER if m.role == "user" else ChatRole.ASSISTANT, content=m.content)
        for m in request.history
    ]

    try:
        result = await run_agent_turn(db, provider, history, request.message)
    except AIProviderError as exc:
        raise AppError(f"AI request failed: {exc}", code="ai_request_failed", status_code=502) from exc

    tool_calls = [
        ToolCallSummary(name=tc["name"], arguments=tc["arguments"]) for tc in result.tool_calls_made
    ]
    return ChatResponse(reply=result.reply, tool_calls=tool_calls)
