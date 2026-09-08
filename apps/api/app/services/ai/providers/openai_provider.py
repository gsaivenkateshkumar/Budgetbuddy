"""OpenAI Chat Completions provider. Never imported/instantiated unless
AI_PROVIDER=openai and OPENAI_API_KEY is set — see factory.py."""
import json
from typing import Any

import httpx

from app.services.ai.base import AIProvider
from app.services.ai.types import AIProviderError, ChatCompletion, ChatMessage, ToolCall, ToolSpec

_API_URL = "https://api.openai.com/v1/chat/completions"


class OpenAIProvider(AIProvider):
    name = "openai"

    def __init__(self, api_key: str, model: str = "gpt-4o-mini"):
        self._api_key = api_key
        self._model = model

    def _to_messages(self, messages: list[ChatMessage]) -> list[dict[str, Any]]:
        result: list[dict[str, Any]] = []
        for m in messages:
            entry: dict[str, Any] = {"role": m.role.value, "content": m.content}
            if m.tool_call_id:
                entry["tool_call_id"] = m.tool_call_id
            if m.name:
                entry["name"] = m.name
            result.append(entry)
        return result

    def _to_tools(self, tools: list[ToolSpec] | None) -> list[dict[str, Any]] | None:
        if not tools:
            return None
        return [
            {
                "type": "function",
                "function": {"name": t.name, "description": t.description, "parameters": t.parameters},
            }
            for t in tools
        ]

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

        choice = data["choices"][0]
        message = choice["message"]
        tool_calls = [
            ToolCall(
                id=tc["id"], name=tc["function"]["name"], arguments=json.loads(tc["function"]["arguments"])
            )
            for tc in (message.get("tool_calls") or [])
        ]
        return ChatCompletion(
            content=message.get("content"), tool_calls=tool_calls, finish_reason=choice["finish_reason"]
        )
