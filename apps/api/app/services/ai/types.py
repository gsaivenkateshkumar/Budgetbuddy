"""Provider-agnostic chat/tool types. No code outside app/services/ai/
should depend on a specific vendor's request/response shape."""
from enum import StrEnum
from typing import Any

from pydantic import BaseModel, Field


class ChatRole(StrEnum):
    SYSTEM = "system"
    USER = "user"
    ASSISTANT = "assistant"
    TOOL = "tool"


class ChatMessage(BaseModel):
    role: ChatRole
    content: str
    tool_call_id: str | None = None
    name: str | None = None


class ToolSpec(BaseModel):
    """A tool the AI may call, described as a JSON-schema object — the
    common ground between OpenAI's `parameters` and Anthropic's
    `input_schema`."""

    name: str
    description: str
    parameters: dict[str, Any]


class ToolCall(BaseModel):
    id: str
    name: str
    arguments: dict[str, Any] = Field(default_factory=dict)


class ChatCompletion(BaseModel):
    content: str | None = None
    tool_calls: list[ToolCall] = Field(default_factory=list)
    finish_reason: str


class AIProviderError(Exception):
    """A configured provider failed to complete a request (network,
    auth, rate limit, malformed response, ...)."""


class AIProviderNotConfiguredError(Exception):
    """No AI provider is configured (AI_PROVIDER=none or missing key).
    Callers must show AI features as unavailable, never fabricate a
    response in place of this."""
