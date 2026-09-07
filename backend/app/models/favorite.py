from sqlmodel import Field, SQLModel, Relationship
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.user import User


class Favorite(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    media_id: int
    media_type: str  # "movie" or "tv"
    title: str
    poster_path: str | None = None

    user: "User" = Relationship(back_populates="favorites")
