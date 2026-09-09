"""Unit tests for Cloudflare Turnstile verification — all network calls
are mocked via respx; nothing here depends on live Cloudflare."""
import httpx
import pytest
import respx
from httpx import Response

from app.core.config import get_settings
from app.services.turnstile_service import verify_turnstile

VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify"


@pytest.fixture(autouse=True)
def _configured_secret(monkeypatch):
    monkeypatch.setattr(get_settings(), "turnstile_secret_key", "test-secret-key")
    yield


def test_missing_token_is_rejected_without_a_network_call():
    assert verify_turnstile(None) is False
    assert verify_turnstile("") is False


def test_unconfigured_secret_fails_closed(monkeypatch):
    monkeypatch.setattr(get_settings(), "turnstile_secret_key", None)

    assert verify_turnstile("some-token") is False


@respx.mock
def test_valid_token_is_accepted():
    route = respx.post(VERIFY_URL).mock(return_value=Response(200, json={"success": True}))

    assert verify_turnstile("real-token", remote_ip="203.0.113.5") is True
    sent = route.calls[0].request
    assert b"secret=test-secret-key" in sent.content
    assert b"response=real-token" in sent.content
    assert b"remoteip=203.0.113.5" in sent.content


@respx.mock
def test_cloudflare_success_false_is_rejected():
    respx.post(VERIFY_URL).mock(
        return_value=Response(200, json={"success": False, "error-codes": ["invalid-input-response"]})
    )

    assert verify_turnstile("bad-token") is False


@respx.mock
def test_cloudflare_http_error_is_rejected():
    respx.post(VERIFY_URL).mock(return_value=Response(500))

    assert verify_turnstile("any-token") is False


@respx.mock
def test_network_failure_is_rejected():
    respx.post(VERIFY_URL).mock(side_effect=httpx.ConnectError("connection refused"))

    assert verify_turnstile("any-token") is False


@respx.mock
def test_timeout_is_rejected():
    respx.post(VERIFY_URL).mock(side_effect=httpx.TimeoutException("timed out"))

    assert verify_turnstile("any-token") is False


@respx.mock
def test_malformed_response_is_rejected():
    respx.post(VERIFY_URL).mock(return_value=Response(200, text="not json"))

    assert verify_turnstile("any-token") is False


@respx.mock
def test_secret_is_never_present_in_a_raised_error(monkeypatch):
    monkeypatch.setattr(get_settings(), "turnstile_secret_key", "super-secret-value")
    respx.post(VERIFY_URL).mock(return_value=Response(500))

    result = verify_turnstile("any-token")

    assert result is False
    # No exception is raised at all (verify_turnstile never raises), so
    # there's nothing for a secret to leak into — this asserts that
    # invariant holds rather than inspecting a (nonexistent) error message.
