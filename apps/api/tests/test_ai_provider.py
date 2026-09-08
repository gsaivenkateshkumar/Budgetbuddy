import json

import pytest
import respx
from httpx import Response

from app.services.ai.factory import get_ai_provider
from app.services.ai.providers.anthropic_provider import AnthropicProvider
from app.services.ai.providers.groq_provider import GroqProvider
from app.services.ai.providers.none_provider import NoneProvider
from app.services.ai.providers.openai_provider import OpenAIProvider
from app.services.ai.types import (
    AIProviderError,
    AIProviderNotConfiguredError,
    ChatMessage,
    ChatRole,
    ToolCall,
    ToolSpec,
)


def test_no_provider_configured_returns_none_provider():
    get_ai_provider.cache_clear()
    provider = get_ai_provider()
    assert isinstance(provider, NoneProvider)
    assert provider.name == "none"


async def test_none_provider_raises_clear_error_never_fabricates():
    provider = NoneProvider()
    with pytest.raises(AIProviderNotConfiguredError):
        await provider.complete([ChatMessage(role=ChatRole.USER, content="hi")])


@respx.mock
async def test_openai_provider_translates_request_and_response():
    respx.post("https://api.openai.com/v1/chat/completions").mock(
        return_value=Response(
            200,
            json={
                "choices": [
                    {
                        "message": {"role": "assistant", "content": "Hello!", "tool_calls": None},
                        "finish_reason": "stop",
                    }
                ]
            },
        )
    )

    provider = OpenAIProvider(api_key="test-key")
    result = await provider.complete([ChatMessage(role=ChatRole.USER, content="hi")])

    assert result.content == "Hello!"
    assert result.tool_calls == []
    assert result.finish_reason == "stop"


@respx.mock
async def test_openai_provider_parses_tool_calls():
    respx.post("https://api.openai.com/v1/chat/completions").mock(
        return_value=Response(
            200,
            json={
                "choices": [
                    {
                        "message": {
                            "role": "assistant",
                            "content": None,
                            "tool_calls": [
                                {
                                    "id": "call_1",
                                    "function": {
                                        "name": "search_products",
                                        "arguments": '{"q": "macbook"}',
                                    },
                                }
                            ],
                        },
                        "finish_reason": "tool_calls",
                    }
                ]
            },
        )
    )

    tool = ToolSpec(name="search_products", description="search", parameters={"type": "object"})
    provider = OpenAIProvider(api_key="test-key")
    result = await provider.complete([ChatMessage(role=ChatRole.USER, content="find a macbook")], [tool])

    assert result.tool_calls[0].name == "search_products"
    assert result.tool_calls[0].arguments == {"q": "macbook"}


@respx.mock
async def test_anthropic_provider_translates_request_and_response():
    respx.post("https://api.anthropic.com/v1/messages").mock(
        return_value=Response(
            200,
            json={
                "content": [{"type": "text", "text": "Hello from Claude!"}],
                "stop_reason": "end_turn",
            },
        )
    )

    provider = AnthropicProvider(api_key="test-key")
    result = await provider.complete(
        [
            ChatMessage(role=ChatRole.SYSTEM, content="You are Budget Buddy."),
            ChatMessage(role=ChatRole.USER, content="hi"),
        ]
    )

    assert result.content == "Hello from Claude!"
    assert result.finish_reason == "end_turn"


@respx.mock
async def test_anthropic_provider_parses_tool_use_blocks():
    respx.post("https://api.anthropic.com/v1/messages").mock(
        return_value=Response(
            200,
            json={
                "content": [
                    {"type": "tool_use", "id": "toolu_1", "name": "get_prices", "input": {"slug": "x"}}
                ],
                "stop_reason": "tool_use",
            },
        )
    )

    tool = ToolSpec(name="get_prices", description="prices", parameters={"type": "object"})
    provider = AnthropicProvider(api_key="test-key")
    result = await provider.complete([ChatMessage(role=ChatRole.USER, content="price?")], [tool])

    assert result.tool_calls[0].name == "get_prices"
    assert result.tool_calls[0].arguments == {"slug": "x"}


def test_openai_serializes_assistant_tool_calls_for_next_round():
    provider = OpenAIProvider(api_key="test-key")
    assistant_msg = ChatMessage(
        role=ChatRole.ASSISTANT,
        content="",
        tool_calls=[ToolCall(id="call_1", name="search_products", arguments={"q": "macbook"})],
    )
    tool_result = ChatMessage(role=ChatRole.TOOL, content='{"total": 1}', tool_call_id="call_1")

    payload = provider._to_messages([assistant_msg, tool_result])

    assert payload[0]["tool_calls"][0]["function"]["name"] == "search_products"
    assert payload[0]["tool_calls"][0]["function"]["arguments"] == '{"q": "macbook"}'
    assert payload[1]["tool_call_id"] == "call_1"


def test_anthropic_serializes_assistant_tool_calls_for_next_round():
    provider = AnthropicProvider(api_key="test-key")
    assistant_msg = ChatMessage(
        role=ChatRole.ASSISTANT,
        content="Let me check.",
        tool_calls=[ToolCall(id="toolu_1", name="get_prices", arguments={"slug": "x"})],
    )
    tool_result = ChatMessage(role=ChatRole.TOOL, content='{"price": "94900"}', tool_call_id="toolu_1")

    payload = provider._to_messages([assistant_msg, tool_result])

    blocks = payload[0]["content"]
    assert {"type": "text", "text": "Let me check."} in blocks
    assert any(b["type"] == "tool_use" and b["name"] == "get_prices" for b in blocks)
    assert payload[1]["content"][0]["type"] == "tool_result"
    assert payload[1]["content"][0]["tool_use_id"] == "toolu_1"


@respx.mock
async def test_groq_provider_sends_request_to_groq_endpoint_with_configured_model():
    route = respx.post("https://api.groq.com/openai/v1/chat/completions").mock(
        return_value=Response(
            200,
            json={
                "choices": [
                    {"message": {"role": "assistant", "content": "Hello!"}, "finish_reason": "stop"}
                ]
            },
        )
    )

    provider = GroqProvider(api_key="gsk-test", model="llama-3.1-8b-instant")
    result = await provider.complete([ChatMessage(role=ChatRole.USER, content="hi")])

    assert result.content == "Hello!"
    assert route.called
    sent_payload = route.calls[0].request.content
    assert json.loads(sent_payload)["model"] == "llama-3.1-8b-instant"
    assert route.calls[0].request.headers["Authorization"] == "Bearer gsk-test"


@respx.mock
async def test_groq_provider_parses_tool_calls():
    respx.post("https://api.groq.com/openai/v1/chat/completions").mock(
        return_value=Response(
            200,
            json={
                "choices": [
                    {
                        "message": {
                            "role": "assistant",
                            "content": None,
                            "tool_calls": [
                                {
                                    "id": "call_1",
                                    "function": {
                                        "name": "search_products",
                                        "arguments": '{"q": "macbook"}',
                                    },
                                }
                            ],
                        },
                        "finish_reason": "tool_calls",
                    }
                ]
            },
        )
    )

    tool = ToolSpec(name="search_products", description="search", parameters={"type": "object"})
    provider = GroqProvider(api_key="gsk-test")
    result = await provider.complete([ChatMessage(role=ChatRole.USER, content="find a macbook")], [tool])

    assert result.tool_calls[0].name == "search_products"
    assert result.tool_calls[0].arguments == {"q": "macbook"}
    assert result.finish_reason == "tool_calls"


@respx.mock
async def test_groq_provider_raises_ai_provider_error_on_http_failure():
    respx.post("https://api.groq.com/openai/v1/chat/completions").mock(return_value=Response(500))

    provider = GroqProvider(api_key="gsk-test")
    with pytest.raises(AIProviderError) as exc_info:
        await provider.complete([ChatMessage(role=ChatRole.USER, content="hi")])

    # The error message must never contain the API key.
    assert "gsk-test" not in str(exc_info.value)


def test_groq_serializes_assistant_tool_calls_for_next_round():
    provider = GroqProvider(api_key="gsk-test")
    assistant_msg = ChatMessage(
        role=ChatRole.ASSISTANT,
        content="",
        tool_calls=[ToolCall(id="call_1", name="search_products", arguments={"q": "macbook"})],
    )
    tool_result = ChatMessage(role=ChatRole.TOOL, content='{"total": 1}', tool_call_id="call_1")

    payload = provider._to_messages([assistant_msg, tool_result])

    assert payload[0]["tool_calls"][0]["function"]["name"] == "search_products"
    assert payload[1]["tool_call_id"] == "call_1"
