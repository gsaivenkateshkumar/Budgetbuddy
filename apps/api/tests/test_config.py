from app.core.config import Settings


def test_sqlalchemy_url_passes_through_sqlite():
    settings = Settings(database_url="sqlite:///./budget_buddy.db")
    assert settings.sqlalchemy_url == "sqlite:///./budget_buddy.db"


def test_sqlalchemy_url_normalizes_bare_postgres_scheme():
    settings = Settings(database_url="postgres://user:pass@host:5432/db")
    assert settings.sqlalchemy_url == "postgresql+psycopg://user:pass@host:5432/db"


def test_sqlalchemy_url_normalizes_bare_postgresql_scheme():
    settings = Settings(database_url="postgresql://user:pass@host:5432/db")
    assert settings.sqlalchemy_url == "postgresql+psycopg://user:pass@host:5432/db"


def test_sqlalchemy_url_leaves_explicit_dialect_alone():
    settings = Settings(database_url="postgresql+psycopg://user:pass@host:5432/db")
    assert settings.sqlalchemy_url == "postgresql+psycopg://user:pass@host:5432/db"


def test_cors_origins_single():
    settings = Settings(frontend_url="https://budgetbuddy.example")
    assert settings.cors_origins == ["https://budgetbuddy.example"]


def test_cors_origins_comma_separated():
    settings = Settings(frontend_url="https://a.example, https://b.example")
    assert settings.cors_origins == ["https://a.example", "https://b.example"]
