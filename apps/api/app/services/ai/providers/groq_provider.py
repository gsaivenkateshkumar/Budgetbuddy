"""Groq provider, via Groq's OpenAI-compatible chat completions endpoint
(https://api.groq.com/openai/v1/chat/completions — same request/response
shape and tools/tool_calls format as OpenAI's Chat Completions API).
Never imported/instantiated unless AI_PROVIDER=groq and GROQ_API_KEY is
set — see factory.py.

This is a distinct provider, not a branch inside OpenAIProvider: it owns
its own endpoint, API key, default model, and error message. Only the
wire-format translation is shared (app/services/ai/providers/_openai_compatible.py),
since Groq deliberately mirrors OpenAI's format.
"""
from typing import Any

import httpx

from app.services.ai.base import AIProvider
from app.services.ai.providers import _openai_compatible as wire
from app.services.ai.types import AIProviderError, ChatCompletion, ChatMessage, ToolSpec

_API_URL = "https://api.groq.com/openai/v1/chat/completions"

# llama-3.3-70b-versatile: Groq's current general-purpose model with
# mature, well-documented tool/function-calling support — the safer
# choice for a first integration over the newer openai/gpt-oss-* models,
# which ship with their own built-in agentic tooling (browser search, code
# execution) that isn't needed here and could complicate plain
# custom-tool function calling. Confirmed active (not deprecated) against
# Groq's model list at implementation time.
_DEFAULT_MODEL = "llama-3.3-70b-versatile"


class GroqProvider(AIProvider):
    name = "groq"

    def __init__(self, api_key: str, model: str = _DEFAULT_MODEL):
        self._api_key = api_key
        self._model = model

    def _to_messages(self, messages: list[ChatMessage]) -> list[dict[str, Any]]:
        return wire.to_messages(messages)

    def _to_tools(self, tools: list[ToolSpec] | None) -> list[dict[str, Any]] | None:
        return wire.to_tools(tools)

    async def complete(
        self, messages: list[ChatMessage], tools: list[ToolSpec] | None = None
    ) -> ChatCompletion:
        payload: dict[str, Any] = {"model": self._model, "messages": self._to_messages(messages)}
        groq_tools = self._to_tools(tools)
        if groq_tools:
            payload["tools"] = groq_tools

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    _API_URL, headers={"Authorization": f"Bearer {self._api_key}"}, json=payload
                )
                response.raise_for_status()
                data = response.json()
        except httpx.HTTPError as exc:
            raise AIProviderError(f"Groq request failed: {exc}") from exc

        return wire.parse_completion(data)
