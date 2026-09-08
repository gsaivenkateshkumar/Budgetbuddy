"""OpenAI Chat Completions provider. Never imported/instantiated unless
AI_PROVIDER=openai and OPENAI_API_KEY is set — see factory.py."""
from typing import Any

import httpx

from app.services.ai.base import AIProvider
from app.services.ai.providers import _openai_compatible as wire
from app.services.ai.types import AIProviderError, ChatCompletion, ChatMessage, ToolSpec

_API_URL = "https://api.openai.com/v1/chat/completions"


class OpenAIProvider(AIProvider):
    name = "openai"

    def __init__(self, api_key: str, model: str = "gpt-4o-mini"):
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
        openai_tools = self._to_tools(tools)
        if openai_tools:
            payload["tools"] = openai_tools

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    _API_URL, headers={"Authorization": f"Bearer {self._api_key}"}, json=payload
                )
                response.raise_for_status()
                data = response.json()
        except httpx.HTTPError as exc:
            raise AIProviderError(f"OpenAI request failed: {exc}") from exc

        return wire.parse_completion(data)
