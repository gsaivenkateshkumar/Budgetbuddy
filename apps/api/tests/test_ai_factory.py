from app.core.config import get_settings
from app.services.ai.factory import get_ai_provider
from app.services.ai.providers.anthropic_provider import AnthropicProvider
from app.services.ai.providers.groq_provider import GroqProvider
from app.services.ai.providers.none_provider import NoneProvider
from app.services.ai.providers.openai_provider import OpenAIProvider


def _reset_caches():
    get_settings.cache_clear()
    get_ai_provider.cache_clear()


def test_openai_configured_without_key_falls_back_to_none(monkeypatch):
    monkeypatch.setenv("AI_PROVIDER", "openai")
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    _reset_caches()
    try:
        assert isinstance(get_ai_provider(), NoneProvider)
    finally:
        monkeypatch.delenv("AI_PROVIDER", raising=False)
        _reset_caches()


def test_openai_configured_with_key_returns_openai_provider(monkeypatch):
    monkeypatch.setenv("AI_PROVIDER", "openai")
    monkeypatch.setenv("OPENAI_API_KEY", "sk-test")
    _reset_caches()
    try:
        assert isinstance(get_ai_provider(), OpenAIProvider)
    finally:
        monkeypatch.delenv("AI_PROVIDER", raising=False)
        monkeypatch.delenv("OPENAI_API_KEY", raising=False)
        _reset_caches()


def test_anthropic_configured_with_key_returns_anthropic_provider(monkeypatch):
    monkeypatch.setenv("AI_PROVIDER", "anthropic")
    monkeypatch.setenv("ANTHROPIC_API_KEY", "sk-ant-test")
    _reset_caches()
    try:
        assert isinstance(get_ai_provider(), AnthropicProvider)
    finally:
        monkeypatch.delenv("AI_PROVIDER", raising=False)
        monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)
        _reset_caches()


def test_groq_configured_without_key_falls_back_to_none(monkeypatch):
    monkeypatch.setenv("AI_PROVIDER", "groq")
    monkeypatch.delenv("GROQ_API_KEY", raising=False)
    _reset_caches()
    try:
        assert isinstance(get_ai_provider(), NoneProvider)
    finally:
        monkeypatch.delenv("AI_PROVIDER", raising=False)
        _reset_caches()


def test_groq_configured_with_key_returns_groq_provider(monkeypatch):
    monkeypatch.setenv("AI_PROVIDER", "groq")
    monkeypatch.setenv("GROQ_API_KEY", "gsk-test")
    _reset_caches()
    try:
        assert isinstance(get_ai_provider(), GroqProvider)
    finally:
        monkeypatch.delenv("AI_PROVIDER", raising=False)
        monkeypatch.delenv("GROQ_API_KEY", raising=False)
        _reset_caches()


def test_groq_uses_configured_model(monkeypatch):
    monkeypatch.setenv("AI_PROVIDER", "groq")
    monkeypatch.setenv("GROQ_API_KEY", "gsk-test")
    monkeypatch.setenv("GROQ_MODEL", "llama-3.1-8b-instant")
    _reset_caches()
    try:
        provider = get_ai_provider()
        assert isinstance(provider, GroqProvider)
        assert provider._model == "llama-3.1-8b-instant"
    finally:
        monkeypatch.delenv("AI_PROVIDER", raising=False)
        monkeypatch.delenv("GROQ_API_KEY", raising=False)
        monkeypatch.delenv("GROQ_MODEL", raising=False)
        _reset_caches()
