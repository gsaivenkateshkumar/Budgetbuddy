from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import User


def get_by_email(db: Session, email: str) -> User | None:
    return db.execute(select(User).where(User.email == email)).scalar_one_or_none()


def get_by_id(db: Session, user_id: int) -> User | None:
    return db.get(User, user_id)


def create_user(db: Session, *, email: str, hashed_password: str, display_name: str | None) -> User:
    user = User(email=email, hashed_password=hashed_password, display_name=display_name)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
