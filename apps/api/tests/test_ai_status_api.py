from app.services.ai.factory import get_ai_provider


def test_ai_status_reports_unconfigured_by_default(client):
    get_ai_provider.cache_clear()
    response = client.get("/ai/status")

    assert response.status_code == 200
    body = response.json()
    assert body == {"configured": False, "provider": "none"}
