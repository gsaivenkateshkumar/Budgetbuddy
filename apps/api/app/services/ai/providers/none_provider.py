"""Active whenever no AI provider is configured (the default). Makes no
network calls and never fabricates a response — the app must keep working
without it; AI-specific UI is responsible for explaining unavailability."""
from app.services.ai.base import AIProvider
from app.services.ai.types import AIProviderNotConfiguredError, ChatCompletion, ChatMessage, ToolSpec


class NoneProvider(AIProvider):
    name = "none"

    async def complete(
        self, messages: list[ChatMessage], tools: list[ToolSpec] | None = None
    ) -> ChatCompletion:
        raise AIProviderNotConfiguredError(
            "No AI provider is configured. Set AI_PROVIDER and the matching API key to enable AI features."
        )
