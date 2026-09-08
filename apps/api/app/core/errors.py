"""Predictable error schema and handlers.

Every error response has the shape:
    {"error": {"code": "...", "message": "...", "request_id": "..."}}
No stack traces or internal details are ever returned to clients.
"""
import logging
import uuid

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

logger = logging.getLogger("budget_buddy.errors")


class AppError(Exception):
    """Base class for domain/application errors with a stable error code."""

    def __init__(self, message: str, code: str = "app_error", status_code: int = status.HTTP_400_BAD_REQUEST):
        self.message = message
        self.code = code
        self.status_code = status_code
        super().__init__(message)


class NotFoundError(AppError):
    def __init__(self, message: str = "Resource not found"):
        super().__init__(message, code="not_found", status_code=status.HTTP_404_NOT_FOUND)


def _error_response(request: Request, code: str, message: str, status_code: int) -> JSONResponse:
    request_id = getattr(request.state, "request_id", None) or str(uuid.uuid4())
    return JSONResponse(
        status_code=status_code,
        content={"error": {"code": code, "message": message, "request_id": request_id}},
    )


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppError)
    async def app_error_handler(request: Request, exc: AppError) -> JSONResponse:
        return _error_response(request, exc.code, exc.message, exc.status_code)

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
        return _error_response(request, "http_error", str(exc.detail), exc.status_code)

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
        return _error_response(
            request, "validation_error", "Request validation failed.", status.HTTP_422_UNPROCESSABLE_ENTITY
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        request_id = getattr(request.state, "request_id", None)
        logger.exception("Unhandled exception", extra={"request_id": request_id})
        return _error_response(
            request, "internal_error", "An unexpected error occurred.", status.HTTP_500_INTERNAL_SERVER_ERROR
        )
