"""Application configuration loaded from environment variables.

All settings are read via pydantic-settings so behavior is identical across
local development, tests, and production — only the underlying environment
variables (and DATABASE_URL) change.
"""
from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_env: Literal["development", "test", "production"] = "development"
    app_name: str = "Budget Buddy API"

    database_url: str = "sqlite:///./budget_buddy.db"

    # AI provider abstraction: "none" disables AI features gracefully.
    ai_provider: Literal["none", "openai", "anthropic", "groq"] = "none"
    openai_api_key: str | None = None
    anthropic_api_key: str | None = None
    groq_api_key: str | None = None
    # See app/services/ai/providers/groq_provider.py for why this isn't
    # llama-3.3-70b-versatile (deprecated by Groq, shutdown 2026-08-16).
    groq_model: str = "openai/gpt-oss-120b"

    # Amazon Creators API (PA-API 5's replacement — PA-API 5 retired
    # 2026-05-15). Optional: ingestion fails gracefully without these, and
    # the app never requires them to start. See
    # app/services/retailers/adapters/amazon_creators.py and
    # docs/data-sources.md for onboarding requirements and what's
    # independently verified vs. inferred from public docs.
    amazon_creators_credential_id: str | None = None
    amazon_creators_credential_secret: str | None = None
    amazon_partner_tag: str | None = None
    amazon_marketplace: str = "www.amazon.in"
    # India is grouped under the EU credential region for the Creators API
    # per public documentation — verify against your own onboarding docs
    # once an account is approved; configurable rather than hardcoded in
    # case Amazon's regional routing differs for your account.
    amazon_creators_token_url: str = "https://api.amazon.co.uk/auth/o2/token"
    amazon_creators_api_base_url: str = "https://creatorsapi.amazon"

    jwt_secret: str = "dev-insecure-secret-change-me"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 60

    # Cloudflare Turnstile (CAPTCHA) — protects /auth/register and
    # /auth/login from automated abuse. Optional at the settings level so
    # the app still starts without it configured, but
    # app/services/turnstile_service.py fails closed (verification always
    # returns False) whenever it's unset, rather than skipping the check.
    # See .env.example for Cloudflare's published test secret keys, used
    # for local development only.
    turnstile_secret_key: str | None = None

    frontend_url: str = "http://localhost:3000"

    # Market/locale defaults — deliberately configuration, not hardcoded
    # business logic, so additional markets can be added later.
    default_country: str = "IN"
    default_currency: str = "INR"
    default_language: str = "en"

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.frontend_url.split(",") if origin.strip()]

    @property
    def sqlalchemy_url(self) -> str:
        """`database_url` normalized for SQLAlchemy 2.x. Some managed
        Postgres providers hand out `postgres://` (or bare
        `postgresql://`) URLs — rewrite to the psycopg3 dialect
        SQLAlchemy expects, so DATABASE_URL can be pasted in as-is."""
        url = self.database_url
        if url.startswith("postgres://"):
            return "postgresql+psycopg://" + url[len("postgres://") :]
        if url.startswith("postgresql://"):
            return "postgresql+psycopg://" + url[len("postgresql://") :]
        return url


@lru_cache
def get_settings() -> Settings:
    return Settings()
