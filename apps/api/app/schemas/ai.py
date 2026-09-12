from typing import Any, Literal

from pydantic import BaseModel, Field


class AIStatus(BaseModel):
    configured: bool
    provider: str


class ChatMessageIn(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=4000)


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    history: list[ChatMessageIn] = Field(default_factory=list, max_length=20)
    business_id: int | None = None


class ToolCallSummary(BaseModel):
    name: str
    arguments: dict[str, Any]


class ChatResponse(BaseModel):
    reply: str
    tool_calls: list[ToolCallSummary]
