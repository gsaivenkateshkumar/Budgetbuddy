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
    groq_model: str = "llama-3.3-70b-versatile"

    jwt_secret: str = "dev-insecure-secret-change-me"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 60

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
