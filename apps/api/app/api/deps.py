"""Shared FastAPI route dependencies."""
from fastapi import Depends, Header
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.errors import AppError
from app.core.security import decode_access_token
from app.models import User
from app.repositories import user_repository


def get_current_user(authorization: str | None = Header(default=None), db: Session = Depends(get_db)) -> User:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise AppError("Not authenticated.", code="not_authenticated", status_code=401)

    token = authorization.split(" ", 1)[1].strip()
    subject = decode_access_token(token)
    if subject is None:
        raise AppError("Invalid or expired token.", code="invalid_token", status_code=401)

    try:
        user_id = int(subject)
    except ValueError:
        raise AppError("Invalid or expired token.", code="invalid_token", status_code=401) from None

    user = user_repository.get_by_id(db, user_id)
    if user is None or not user.is_active:
        raise AppError("Invalid or expired token.", code="invalid_token", status_code=401)

    return user
