"""Shared request/response translation for OpenAI-Chat-Completions-shaped
APIs (OpenAI itself, and Groq's OpenAI-compatible endpoint). Not a
provider — `OpenAIProvider` and `GroqProvider` each own their endpoint,
API key, default model, and error message; only the wire-format
translation is shared, so adding a provider here never turns into a
branch inside another provider's class."""
import json
from typing import Any

from app.services.ai.types import ChatCompletion, ChatMessage, ToolCall, ToolSpec


def to_messages(messages: list[ChatMessage]) -> list[dict[str, Any]]:
    result: list[dict[str, Any]] = []
    for m in messages:
        entry: dict[str, Any] = {"role": m.role.value, "content": m.content or None}
        if m.tool_call_id:
            entry["tool_call_id"] = m.tool_call_id
        if m.name:
            entry["name"] = m.name
        if m.tool_calls:
            entry["tool_calls"] = [
                {
                    "id": tc.id,
                    "type": "function",
                    "function": {"name": tc.name, "arguments": json.dumps(tc.arguments)},
                }
                for tc in m.tool_calls
            ]
        result.append(entry)
    return result


def to_tools(tools: list[ToolSpec] | None) -> list[dict[str, Any]] | None:
    if not tools:
        return None
    return [
        {
            "type": "function",
            "function": {"name": t.name, "description": t.description, "parameters": t.parameters},
        }
        for t in tools
    ]


def parse_completion(data: dict[str, Any]) -> ChatCompletion:
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
