def test_health_check_returns_ok(client):
    response = client.get("/health")

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["database"] == "connected"


def test_health_check_includes_request_id_header(client):
    response = client.get("/health")

    assert "X-Request-ID" in response.headers
