"""Resolves the active AIProvider from settings. This is the only place
that decides which provider is active — everything else depends on the
AIProvider interface, not on AI_PROVIDER/keys directly."""
from functools import lru_cache

from app.core.config import get_settings
from app.services.ai.base import AIProvider
from app.services.ai.providers.anthropic_provider import AnthropicProvider
from app.services.ai.providers.none_provider import NoneProvider
from app.services.ai.providers.openai_provider import OpenAIProvider


@lru_cache
def get_ai_provider() -> AIProvider:
    settings = get_settings()

    if settings.ai_provider == "openai" and settings.openai_api_key:
        return OpenAIProvider(api_key=settings.openai_api_key)

    if settings.ai_provider == "anthropic" and settings.anthropic_api_key:
        return AnthropicProvider(api_key=settings.anthropic_api_key)

    return NoneProvider()
