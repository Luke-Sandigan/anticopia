import hmac

from fastapi import HTTPException

from app.config import API_KEY


def require_api_key(value: str | None) -> None:
    if not API_KEY:
        raise HTTPException(
            status_code=503,
            detail="Service authentication is not configured",
        )

    if value is None or not hmac.compare_digest(value, API_KEY):
        raise HTTPException(
            status_code=401,
            detail="Invalid API key",
        )
