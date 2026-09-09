"""Shared pytest fixtures.

Tests run against an isolated in-memory SQLite database — never the
developer's local budget_buddy.db file.
"""
import os

os.environ["DATABASE_URL"] = "sqlite:///:memory:"
os.environ["APP_ENV"] = "test"

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.main import app


# Auth tests exercise register/login business logic, not Cloudflare
# itself — default every test to a "verified" Turnstile token so existing
# and new auth-flow tests don't need live/mocked network calls. Tests that
# specifically cover CAPTCHA rejection (see test_turnstile_service.py and
# test_auth_api.py) override this per-test with monkeypatch.
@pytest.fixture(autouse=True)
def _turnstile_verified_by_default(monkeypatch):
    monkeypatch.setattr("app.api.routes.auth.verify_turnstile", lambda token, remote_ip=None: bool(token))

_engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
_TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=_engine)


@pytest.fixture()
def db_session():
    Base.metadata.create_all(bind=_engine)
    session = _TestSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=_engine)


@pytest.fixture()
def client(db_session):
    def _override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = _override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
