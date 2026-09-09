"""Cloudflare Turnstile (CAPTCHA) server-side verification.

This is the only place a Turnstile token is actually trusted — the
frontend widget only ever produces a token; whether that token is real is
decided here, by asking Cloudflare directly. `verify_turnstile` fails
closed: a missing token, an unconfigured secret, a network error, a
timeout, a malformed response, or an explicit `success: false` from
Cloudflare are all treated as "not verified." Nothing in this module ever
lets an auth request through on ambiguity.
"""
import logging

import httpx

from app.core.config import get_settings

logger = logging.getLogger("budget_buddy.turnstile")

_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify"
_TIMEOUT_SECONDS = 5.0


def verify_turnstile(token: str | None, remote_ip: str | None = None) -> bool:
    """Returns True only when Cloudflare confirms `token` is a genuine,
    unconsumed Turnstile response for this site. Never raises — every
    failure mode returns False so callers can fail closed uniformly.

    `remote_ip` is passed to Cloudflare only as an optional risk-scoring
    hint (per their API); it is never the basis for a pass/fail decision
    on its own, and callers should only pass a value obtained from the
    ASGI connection itself (e.g. `request.client.host`), never from a
    client-supplied header, since this app has no trusted-proxy
    configuration to safely validate forwarded-for headers.
    """
    if not token:
        return False

    settings = get_settings()
    if not settings.turnstile_secret_key:
        # No secret configured — verification cannot proceed. Fail closed
        # rather than silently letting auth through unprotected.
        logger.error("Turnstile verification attempted with no TURNSTILE_SECRET_KEY configured")
        return False

    data = {"secret": settings.turnstile_secret_key, "response": token}
    if remote_ip:
        data["remoteip"] = remote_ip

    try:
        with httpx.Client(timeout=_TIMEOUT_SECONDS) as client:
            response = client.post(_VERIFY_URL, data=data)
            response.raise_for_status()
            body = response.json()
    except httpx.HTTPError:
        logger.warning("Turnstile verification request failed (network or HTTP error)")
        return False
    except ValueError:
        logger.warning("Turnstile verification returned a non-JSON response")
        return False

    return body.get("success") is True
