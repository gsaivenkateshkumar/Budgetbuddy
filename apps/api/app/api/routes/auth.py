from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.core.errors import AppError
from app.models import User
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserRead
from app.services import auth_service
from app.services.turnstile_service import verify_turnstile

router = APIRouter(prefix="/auth", tags=["auth"])


def _require_captcha(request: Request, token: str) -> None:
    # `request.client.host` is the direct ASGI connection peer, not a
    # client-supplied header — safe to pass as Cloudflare's optional
    # risk-scoring hint even without a trusted-proxy setup. It's only
    # ever informational; verification success/failure is decided solely
    # by Cloudflare's response to the token itself.
    remote_ip = request.client.host if request.client else None
    if not verify_turnstile(token, remote_ip=remote_ip):
        raise AppError(
            "Security verification failed.", code="captcha_failed", status_code=status.HTTP_400_BAD_REQUEST
        )


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(request: RegisterRequest, http_request: Request, db: Session = Depends(get_db)) -> TokenResponse:
    _require_captcha(http_request, request.turnstile_token)
    user = auth_service.register_user(
        db, email=request.email, password=request.password, display_name=request.display_name
    )
    return TokenResponse(access_token=auth_service.issue_token_for(user))


@router.post("/login", response_model=TokenResponse)
def login(request: LoginRequest, http_request: Request, db: Session = Depends(get_db)) -> TokenResponse:
    _require_captcha(http_request, request.turnstile_token)
    user = auth_service.authenticate_user(db, email=request.email, password=request.password)
    return TokenResponse(access_token=auth_service.issue_token_for(user))


@router.get("/me", response_model=UserRead)
def me(current_user: User = Depends(get_current_user)) -> UserRead:
    return UserRead.model_validate(current_user)
