"""Turns a provenance timestamp into user-facing freshness text, e.g.
"Checked 8 minutes ago" — computed on read, never stored as a claim."""
from datetime import UTC, datetime


def freshness_text(collected_at: datetime, now: datetime | None = None) -> str:
    now = now or datetime.now(UTC)
    if collected_at.tzinfo is None:
        collected_at = collected_at.replace(tzinfo=UTC)

    seconds = max(0, int((now - collected_at).total_seconds()))
    if seconds < 60:
        return "Checked just now"

    minutes = seconds // 60
    if minutes < 60:
        return f"Checked {minutes} minute{'s' if minutes != 1 else ''} ago"

    hours = minutes // 60
    if hours < 24:
        return f"Checked {hours} hour{'s' if hours != 1 else ''} ago"

    days = hours // 24
    return f"Checked {days} day{'s' if days != 1 else ''} ago"
