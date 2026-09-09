def _register_payload(**overrides):
    payload = {"email": "alice@example.com", "password": "correct-horse", "turnstile_token": "test-token"}
    payload.update(overrides)
    return payload


def _login_payload(**overrides):
    payload = {"email": "alice@example.com", "password": "correct-horse", "turnstile_token": "test-token"}
    payload.update(overrides)
    return payload


def test_register_creates_user_and_returns_token(client):
    response = client.post("/auth/register", json=_register_payload(display_name="Alice"))

    assert response.status_code == 201
    body = response.json()
    assert body["token_type"] == "bearer"
    assert body["access_token"]


def test_register_rejects_duplicate_email(client):
    payload = _register_payload(email="bob@example.com")
    first = client.post("/auth/register", json=payload)
    assert first.status_code == 201

    second = client.post("/auth/register", json=payload)
    assert second.status_code == 409
    assert second.json()["error"]["code"] == "email_taken"


def test_register_rejects_short_password(client):
    response = client.post(
        "/auth/register", json=_register_payload(email="short@example.com", password="abc")
    )
    assert response.status_code == 422


def test_register_rejects_invalid_email(client):
    response = client.post("/auth/register", json=_register_payload(email="not-an-email"))
    assert response.status_code == 422


def test_register_rejects_missing_turnstile_token(client):
    payload = _register_payload(email="noc@example.com")
    del payload["turnstile_token"]

    response = client.post("/auth/register", json=payload)

    assert response.status_code == 422


def test_register_rejects_invalid_turnstile_token(client, monkeypatch):
    monkeypatch.setattr("app.api.routes.auth.verify_turnstile", lambda token, remote_ip=None: False)

    response = client.post("/auth/register", json=_register_payload(email="captcha-fail@example.com"))

    assert response.status_code == 400
    assert response.json()["error"]["code"] == "captcha_failed"


def test_register_rejected_captcha_does_not_create_a_user(client, monkeypatch, db_session):
    from app.repositories import user_repository

    monkeypatch.setattr("app.api.routes.auth.verify_turnstile", lambda token, remote_ip=None: False)

    client.post("/auth/register", json=_register_payload(email="never-created@example.com"))

    assert user_repository.get_by_email(db_session, "never-created@example.com") is None


def test_login_with_correct_credentials_returns_token(client):
    client.post("/auth/register", json=_register_payload(email="carol@example.com"))

    response = client.post("/auth/login", json=_login_payload(email="carol@example.com"))

    assert response.status_code == 200
    assert response.json()["access_token"]


def test_login_with_wrong_password_is_rejected(client):
    client.post("/auth/register", json=_register_payload(email="dave@example.com"))

    response = client.post(
        "/auth/login", json=_login_payload(email="dave@example.com", password="wrong-password")
    )

    assert response.status_code == 401
    assert response.json()["error"]["code"] == "invalid_credentials"


def test_login_with_unknown_email_is_rejected(client):
    response = client.post(
        "/auth/login", json=_login_payload(email="nobody@example.com", password="whatever123")
    )

    assert response.status_code == 401
    assert response.json()["error"]["code"] == "invalid_credentials"


def test_login_rejects_missing_turnstile_token(client):
    payload = _login_payload(email="nobody@example.com")
    del payload["turnstile_token"]

    response = client.post("/auth/login", json=payload)

    assert response.status_code == 422


def test_login_rejects_invalid_turnstile_token_even_with_correct_credentials(client, monkeypatch):
    client.post("/auth/register", json=_register_payload(email="heidi@example.com"))
    monkeypatch.setattr("app.api.routes.auth.verify_turnstile", lambda token, remote_ip=None: False)

    response = client.post("/auth/login", json=_login_payload(email="heidi@example.com"))

    assert response.status_code == 400
    assert response.json()["error"]["code"] == "captcha_failed"


def test_me_requires_authentication(client):
    response = client.get("/auth/me")
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "not_authenticated"


def test_me_returns_current_user_with_valid_token(client):
    payload = _register_payload(email="erin@example.com", display_name="Erin")
    register = client.post("/auth/register", json=payload)
    token = register.json()["access_token"]

    response = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 200
    body = response.json()
    assert body["email"] == "erin@example.com"
    assert body["display_name"] == "Erin"
    assert "hashed_password" not in body
    assert "password" not in body
