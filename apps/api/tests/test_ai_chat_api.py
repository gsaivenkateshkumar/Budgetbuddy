from app.services.ai.factory import get_ai_provider


def test_chat_returns_503_when_ai_not_configured(client):
    get_ai_provider.cache_clear()
    response = client.post("/ai/chat", json={"message": "hello", "history": []})

    assert response.status_code == 503
    assert response.json()["error"]["code"] == "ai_not_configured"


def test_chat_rejects_empty_message(client):
    response = client.post("/ai/chat", json={"message": "", "history": []})

    assert response.status_code == 422
