def test_register_creates_user_and_returns_token(client):
    response = client.post(
        "/auth/register",
        json={"email": "alice@example.com", "password": "correct-horse", "display_name": "Alice"},
    )

    assert response.status_code == 201
    body = response.json()
    assert body["token_type"] == "bearer"
    assert body["access_token"]


def test_register_rejects_duplicate_email(client):
    payload = {"email": "bob@example.com", "password": "correct-horse"}
    first = client.post("/auth/register", json=payload)
    assert first.status_code == 201

    second = client.post("/auth/register", json=payload)
    assert second.status_code == 409
    assert second.json()["error"]["code"] == "email_taken"


def test_register_rejects_short_password(client):
    response = client.post("/auth/register", json={"email": "short@example.com", "password": "abc"})
    assert response.status_code == 422


def test_register_rejects_invalid_email(client):
    response = client.post("/auth/register", json={"email": "not-an-email", "password": "correct-horse"})
    assert response.status_code == 422


def test_login_with_correct_credentials_returns_token(client):
    client.post("/auth/register", json={"email": "carol@example.com", "password": "correct-horse"})

    response = client.post("/auth/login", json={"email": "carol@example.com", "password": "correct-horse"})

    assert response.status_code == 200
    assert response.json()["access_token"]


def test_login_with_wrong_password_is_rejected(client):
    client.post("/auth/register", json={"email": "dave@example.com", "password": "correct-horse"})

    response = client.post("/auth/login", json={"email": "dave@example.com", "password": "wrong-password"})

    assert response.status_code == 401
    assert response.json()["error"]["code"] == "invalid_credentials"


def test_login_with_unknown_email_is_rejected(client):
    response = client.post("/auth/login", json={"email": "nobody@example.com", "password": "whatever123"})

    assert response.status_code == 401
    assert response.json()["error"]["code"] == "invalid_credentials"


def test_me_requires_authentication(client):
    response = client.get("/auth/me")
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "not_authenticated"


def test_me_returns_current_user_with_valid_token(client):
    register = client.post(
        "/auth/register",
        json={"email": "erin@example.com", "password": "correct-horse", "display_name": "Erin"},
    )
    token = register.json()["access_token"]

    response = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 200
    body = response.json()
    assert body["email"] == "erin@example.com"
    assert body["display_name"] == "Erin"
    assert "hashed_password" not in body
    assert "password" not in body
