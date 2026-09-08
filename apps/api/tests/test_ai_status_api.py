from app.core.config import get_settings
from app.services.ai.factory import get_ai_provider


def _reset_caches():
    get_settings.cache_clear()
    get_ai_provider.cache_clear()


def test_ai_status_reports_unconfigured_by_default(client):
    get_ai_provider.cache_clear()
    response = client.get("/ai/status")

    assert response.status_code == 200
    body = response.json()
    assert body == {"configured": False, "provider": "none"}


def test_ai_status_reports_configured_for_groq(client, monkeypatch):
    """Regression test: the /ai/status endpoint must report Groq as
    configured when AI_PROVIDER=groq and GROQ_API_KEY is set — this is
    the exact check the /ask frontend page relies on to decide whether to
    show the chat UI or the "AI not configured" notice."""
    monkeypatch.setenv("AI_PROVIDER", "groq")
    monkeypatch.setenv("GROQ_API_KEY", "gsk-fake-test-key")
    _reset_caches()
    try:
        response = client.get("/ai/status")
        assert response.status_code == 200
        assert response.json() == {"configured": True, "provider": "groq"}
    finally:
        monkeypatch.delenv("AI_PROVIDER", raising=False)
        monkeypatch.delenv("GROQ_API_KEY", raising=False)
        _reset_caches()


def test_ai_status_reports_unconfigured_for_groq_without_key(client, monkeypatch):
    monkeypatch.setenv("AI_PROVIDER", "groq")
    monkeypatch.delenv("GROQ_API_KEY", raising=False)
    _reset_caches()
    try:
        response = client.get("/ai/status")
        assert response.status_code == 200
        assert response.json() == {"configured": False, "provider": "none"}
    finally:
        monkeypatch.delenv("AI_PROVIDER", raising=False)
        _reset_caches()
