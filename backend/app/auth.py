from __future__ import annotations

import os
from pathlib import Path
from typing import Annotated
from uuid import UUID

from dotenv import load_dotenv
from fastapi import Depends, HTTPException, status
from fastapi.security import (
    HTTPAuthorizationCredentials,
    HTTPBearer,
)
from supabase import Client, create_client
from supabase_auth.errors import AuthError


BACKEND_DIR = Path(__file__).resolve().parents[1]
load_dotenv(BACKEND_DIR / ".env")


SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_PUBLISHABLE_KEY = os.getenv(
    "SUPABASE_PUBLISHABLE_KEY"
)

if not SUPABASE_URL:
    raise RuntimeError("SUPABASE_URL is required")

if not SUPABASE_PUBLISHABLE_KEY:
    raise RuntimeError(
        "SUPABASE_PUBLISHABLE_KEY is required"
    )


supabase: Client = create_client(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
)

# Reads: Authorization: Bearer <token>
# auto_error=False lets us return our own consistent 401.
bearer_scheme = HTTPBearer(auto_error=False)


def unauthorized(
    detail: str = "Invalid or missing access token",
) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detail,
        headers={"WWW-Authenticate": "Bearer"},
    )


def get_current_user_id(
    credentials: Annotated[
        HTTPAuthorizationCredentials | None,
        Depends(bearer_scheme),
    ],
) -> UUID:
    if credentials is None:
        raise unauthorized(
            "Authorization bearer token is required"
        )

    if credentials.scheme.lower() != "bearer":
        raise unauthorized(
            "Authorization scheme must be Bearer"
        )

    token = credentials.credentials

    try:
        response = supabase.auth.get_claims(token)

        if response is None:
            raise unauthorized()

        claims = response.get("claims", {})
        subject = claims.get("sub")

        if not subject:
            raise unauthorized(
                "Token does not contain a user ID"
            )

        return UUID(str(subject))

    except HTTPException:
        raise

    except (AuthError, TypeError, ValueError) as error:
        raise unauthorized() from error


CurrentUserId = Annotated[
    UUID,
    Depends(get_current_user_id),
]