def test_404_returns_structured_error_schema(client):
    response = client.get("/does-not-exist")

    assert response.status_code == 404
    body = response.json()
    assert "error" in body
    assert body["error"]["code"] == "http_error"
    assert "request_id" in body["error"]
