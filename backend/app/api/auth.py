from datetime import datetime, timezone
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, Response, Request, status
from sqlmodel import Session, select

from app.core.config import settings
from app.core.database import get_session
from app.core.security import create_access_token, decode_access_token, get_password_hash, verify_password
from app.models.user import User, UserCreate, UserRead

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])

COOKIE_NAME = "access_token"


def get_current_user(
    request: Request,
    session: Annotated[Session, Depends(get_session)],
) -> User:
    token = request.cookies.get(COOKIE_NAME)
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    user = session.get(User, int(user_id))
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    return user


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def register(
    user_in: UserCreate,
    session: Annotated[Session, Depends(get_session)],
) -> Any:
    existing = session.exec(select(User).where(User.email == user_in.email)).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    user = User(
        email=user_in.email,
        first_name=user_in.first_name,
        last_name=user_in.last_name,
        hashed_password=get_password_hash(user_in.password),
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


@router.post("/login")
def login(
    response: Response,
    user_in: UserCreate,
    session: Annotated[Session, Depends(get_session)],
) -> Any:
    user = session.exec(select(User).where(User.email == user_in.email)).first()
    if not user or not verify_password(user_in.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    token = create_access_token({"sub": str(user.id)})
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        samesite=settings.cookie_samesite,
        secure=settings.cookie_secure,
        max_age=settings.access_token_expire_minutes * 60,
    )
    return {"message": "Login successful"}


@router.post("/logout")
def logout(response: Response) -> Any:
    response.delete_cookie(
        key=COOKIE_NAME,
        samesite=settings.cookie_samesite,
        secure=settings.cookie_secure,
        httponly=True,
    )
    return {"message": "Logout successful"}


@router.get("/me", response_model=UserRead)
def me(current_user: Annotated[User, Depends(get_current_user)]) -> Any:
    return current_user
