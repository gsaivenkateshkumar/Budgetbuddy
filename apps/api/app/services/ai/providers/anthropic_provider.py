"""Anthropic Messages API provider. Never imported/instantiated unless
AI_PROVIDER=anthropic and ANTHROPIC_API_KEY is set — see factory.py."""
from typing import Any

import httpx

from app.services.ai.base import AIProvider
from app.services.ai.types import AIProviderError, ChatCompletion, ChatMessage, ChatRole, ToolCall, ToolSpec

_API_URL = "https://api.anthropic.com/v1/messages"
_ANTHROPIC_VERSION = "2023-06-01"
_DEFAULT_MAX_TOKENS = 1024


class AnthropicProvider(AIProvider):
    name = "anthropic"

    def __init__(self, api_key: str, model: str = "claude-sonnet-5"):
        self._api_key = api_key
        self._model = model

    def _split_system(self, messages: list[ChatMessage]) -> tuple[str | None, list[ChatMessage]]:
        system: str | None = None
        rest: list[ChatMessage] = []
        for m in messages:
            if m.role == ChatRole.SYSTEM and system is None:
                system = m.content
            else:
                rest.append(m)
        return system, rest

    def _to_messages(self, messages: list[ChatMessage]) -> list[dict[str, Any]]:
        result: list[dict[str, Any]] = []
        for m in messages:
            if m.role == ChatRole.TOOL:
                result.append(
                    {
                        "role": "user",
                        "content": [
                            {"type": "tool_result", "tool_use_id": m.tool_call_id, "content": m.content}
                        ],
                    }
                )
            elif m.role == ChatRole.ASSISTANT and m.tool_calls:
                content: list[dict[str, Any]] = []
                if m.content:
                    content.append({"type": "text", "text": m.content})
                content.extend(
                    {"type": "tool_use", "id": tc.id, "name": tc.name, "input": tc.arguments}
                    for tc in m.tool_calls
                )
                result.append({"role": "assistant", "content": content})
            else:
                role = "assistant" if m.role == ChatRole.ASSISTANT else "user"
                result.append({"role": role, "content": m.content})
        return result

    def _to_tools(self, tools: list[ToolSpec] | None) -> list[dict[str, Any]] | None:
        if not tools:
            return None
        return [{"name": t.name, "description": t.description, "input_schema": t.parameters} for t in tools]

    async def complete(
        self, messages: list[ChatMessage], tools: list[ToolSpec] | None = None
    ) -> ChatCompletion:
        system, rest = self._split_system(messages)
        payload: dict[str, Any] = {
            "model": self._model,
            "max_tokens": _DEFAULT_MAX_TOKENS,
            "messages": self._to_messages(rest),
        }
        if system:
            payload["system"] = system
        anthropic_tools = self._to_tools(tools)
        if anthropic_tools:
            payload["tools"] = anthropic_tools

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    _API_URL,
                    headers={
                        "x-api-key": self._api_key,
                        "anthropic-version": _ANTHROPIC_VERSION,
                        "content-type": "application/json",
                    },
                    json=payload,
                )
                response.raise_for_status()
                data = response.json()
        except httpx.HTTPError as exc:
            raise AIProviderError(f"Anthropic request failed: {exc}") from exc

        text_parts: list[str] = []
        tool_calls: list[ToolCall] = []
        for block in data.get("content", []):
            if block["type"] == "text":
                text_parts.append(block["text"])
            elif block["type"] == "tool_use":
                tool_calls.append(ToolCall(id=block["id"], name=block["name"], arguments=block["input"]))

        return ChatCompletion(
            content="".join(text_parts) if text_parts else None,
            tool_calls=tool_calls,
            finish_reason=data.get("stop_reason", "stop"),
        )
