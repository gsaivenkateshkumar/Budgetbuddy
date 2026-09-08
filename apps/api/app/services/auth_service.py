"""Registration/login business logic. Error messages for login failures
are deliberately generic ("incorrect email or password") so a bad actor
can't use them to enumerate registered email addresses."""
from sqlalchemy.orm import Session

from app.core.errors import AppError
from app.core.security import create_access_token, hash_password, verify_password
from app.models import User
from app.repositories import user_repository


def register_user(db: Session, *, email: str, password: str, display_name: str | None) -> User:
    if user_repository.get_by_email(db, email):
        raise AppError("An account with this email already exists.", code="email_taken", status_code=409)
    return user_repository.create_user(
        db, email=email, hashed_password=hash_password(password), display_name=display_name
    )


def authenticate_user(db: Session, *, email: str, password: str) -> User:
    user = user_repository.get_by_email(db, email)
    if user is None or not verify_password(password, user.hashed_password):
        raise AppError("Incorrect email or password.", code="invalid_credentials", status_code=401)
    if not user.is_active:
        raise AppError("This account is disabled.", code="account_disabled", status_code=403)
    return user


def issue_token_for(user: User) -> str:
    return create_access_token(subject=str(user.id))
