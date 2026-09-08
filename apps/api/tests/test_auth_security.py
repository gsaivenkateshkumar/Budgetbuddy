"""Security/authorization-focused tests for the auth foundation (Phase 14
acceptance criterion: "Security tests/basic authorization tests pass.")"""
from datetime import UTC, datetime, timedelta

from jose import jwt

from app.core.config import get_settings
from app.core.security import create_access_token, decode_access_token, hash_password, verify_password
from app.repositories import user_repository


def test_password_is_hashed_not_stored_plaintext(db_session):
    user = user_repository.create_user(
        db_session,
        email="secure@example.com",
        hashed_password=hash_password("correct-horse"),
        display_name=None,
    )

    assert user.hashed_password != "correct-horse"
    assert user.hashed_password.startswith("$2b$")


def test_same_password_hashes_differently_each_time():
    assert hash_password("correct-horse") != hash_password("correct-horse")


def test_verify_password_accepts_correct_and_rejects_incorrect():
    hashed = hash_password("correct-horse")
    assert verify_password("correct-horse", hashed) is True
    assert verify_password("wrong-password", hashed) is False


def test_verify_password_never_raises_on_malformed_hash():
    assert verify_password("anything", "not-a-real-bcrypt-hash") is False


def test_decode_access_token_rejects_tampered_signature():
    token = create_access_token(subject="1")
    tampered = token[:-4] + ("aaaa" if not token.endswith("aaaa") else "bbbb")

    assert decode_access_token(tampered) is None


def test_decode_access_token_rejects_wrong_secret():
    settings = get_settings()
    wrong_secret_token = jwt.encode(
        {"sub": "1", "exp": datetime.now(UTC) + timedelta(minutes=5)},
        "a-completely-different-secret",
        algorithm=settings.jwt_algorithm,
    )

    assert decode_access_token(wrong_secret_token) is None


def test_decode_access_token_rejects_expired_token():
    settings = get_settings()
    expired_token = jwt.encode(
        {"sub": "1", "exp": datetime.now(UTC) - timedelta(minutes=5)},
        settings.jwt_secret,
        algorithm=settings.jwt_algorithm,
    )

    assert decode_access_token(expired_token) is None


def test_decode_access_token_rejects_garbage_string():
    assert decode_access_token("not.a.jwt") is None


def test_me_rejects_malformed_authorization_header(client):
    register = client.post("/auth/register", json={"email": "frank@example.com", "password": "correct-horse"})
    token = register.json()["access_token"]

    no_bearer_prefix = client.get("/auth/me", headers={"Authorization": token})
    assert no_bearer_prefix.status_code == 401

    garbage = client.get("/auth/me", headers={"Authorization": "Bearer not-a-real-token"})
    assert garbage.status_code == 401


def test_me_rejects_token_for_nonexistent_user(client):
    forged_token = create_access_token(subject="999999")

    response = client.get("/auth/me", headers={"Authorization": f"Bearer {forged_token}"})

    assert response.status_code == 401
    assert response.json()["error"]["code"] == "invalid_token"


def test_register_and_login_responses_never_include_password_fields(client):
    register = client.post(
        "/auth/register", json={"email": "grace@example.com", "password": "correct-horse"}
    )
    login = client.post("/auth/login", json={"email": "grace@example.com", "password": "correct-horse"})

    for response in (register, login):
        body = response.json()
        assert "password" not in body
        assert "hashed_password" not in body
