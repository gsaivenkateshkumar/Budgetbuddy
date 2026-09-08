"""Structured logging configuration.

Logs are emitted as single-line key=value structured records so they remain
greppable locally and are easy to ship to a log aggregator in production.
Never log secrets (passwords, API keys, tokens) — see docs/security.md.
"""
import logging
import sys

from app.core.config import get_settings


class StructuredFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        base = (
            f'ts="{self.formatTime(record, "%Y-%m-%dT%H:%M:%S%z")}" '
            f'level={record.levelname} '
            f'logger={record.name} '
            f'msg="{record.getMessage()}"'
        )
        request_id = getattr(record, "request_id", None)
        if request_id:
            base += f' request_id={request_id}'
        if record.exc_info:
            base += f'\n{self.formatException(record.exc_info)}'
        return base


def configure_logging() -> None:
    settings = get_settings()
    level = logging.DEBUG if settings.app_env == "development" else logging.INFO

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(StructuredFormatter())

    root = logging.getLogger()
    root.handlers.clear()
    root.addHandler(handler)
    root.setLevel(level)

    # Quiet noisy third-party loggers unless we're debugging.
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
