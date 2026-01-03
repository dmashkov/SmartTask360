"""
SmartTask360 — Custom Exceptions
"""


class AppException(Exception):
    """Base application exception."""

    def __init__(
        self,
        message: str,
        code: str = "INTERNAL_ERROR",
        status_code: int = 500,
        details: dict | None = None,
    ):
        self.message = message
        self.code = code
        self.status_code = status_code
        self.details = details or {}
        super().__init__(message)


class ValidationError(AppException):
    """Validation error."""

    def __init__(self, message: str, details: dict | None = None):
        super().__init__(message, "VALIDATION_ERROR", 400, details)


class UnauthorizedError(AppException):
    """Authentication required."""

    def __init__(self, message: str = "Authentication required"):
        super().__init__(message, "UNAUTHORIZED", 401)


class ForbiddenError(AppException):
    """Insufficient permissions."""

    def __init__(self, message: str = "Insufficient permissions"):
        super().__init__(message, "FORBIDDEN", 403)


class NotFoundError(AppException):
    """Resource not found."""

    def __init__(self, resource: str = "Resource", id: str | None = None):
        message = f"{resource} not found"
        if id:
            message = f"{resource} with id '{id}' not found"
        super().__init__(message, "NOT_FOUND", 404)


class ConflictError(AppException):
    """Business rule conflict."""

    def __init__(self, message: str):
        super().__init__(message, "CONFLICT", 409)


class AIServiceError(AppException):
    """AI service error."""

    def __init__(self, message: str = "AI service unavailable"):
        super().__init__(message, "AI_SERVICE_ERROR", 503)
