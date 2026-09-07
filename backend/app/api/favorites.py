from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.api.auth import get_current_user
from app.core.database import get_session
from app.models.favorite import Favorite
from app.models.user import User

router = APIRouter(prefix="/api/v1/favorites", tags=["favorites"])


@router.get("")
def list_favorites(
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[Session, Depends(get_session)],
) -> Any:
    favorites = session.exec(
        select(Favorite).where(Favorite.user_id == current_user.id)
    ).all()
    return favorites


@router.post("", status_code=status.HTTP_201_CREATED)
def add_favorite(
    favorite_in: dict,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[Session, Depends(get_session)],
) -> Any:
    existing = session.exec(
        select(Favorite).where(
            Favorite.user_id == current_user.id,
            Favorite.media_id == favorite_in["media_id"],
            Favorite.media_type == favorite_in["media_type"],
        )
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Favorite already exists")

    favorite = Favorite(
        user_id=current_user.id,
        media_id=favorite_in["media_id"],
        media_type=favorite_in["media_type"],
        title=favorite_in["title"],
        poster_path=favorite_in.get("poster_path"),
    )
    session.add(favorite)
    session.commit()
    session.refresh(favorite)
    return favorite


@router.delete("/{media_id}")
def remove_favorite(
    media_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[Session, Depends(get_session)],
) -> Any:
    favorite = session.exec(
        select(Favorite).where(
            Favorite.user_id == current_user.id,
            Favorite.media_id == media_id,
        )
    ).first()
    if not favorite:
        raise HTTPException(status_code=404, detail="Favorite not found")
    session.delete(favorite)
    session.commit()
    return {"message": "Favorite removed"}
