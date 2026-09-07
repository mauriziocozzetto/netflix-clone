from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, Query

from app.services import tmdb_client

router = APIRouter(prefix="/api/v1/media", tags=["media"])


@router.get("/trending")
async def trending(media_type: str = Query("all", pattern="^(all|movie|tv)$")) -> Any:
    return await tmdb_client.get_trending(media_type)


@router.get("/popular/{media_type}")
async def popular(media_type: str) -> Any:
    if media_type not in {"movie", "tv"}:
        raise HTTPException(status_code=400, detail="media_type must be movie or tv")
    return await tmdb_client.get_popular(media_type)


@router.get("/category/{category_name}")
async def category(
    category_name: str,
    media_type: str = Query("movie", pattern="^(movie|tv)$"),
) -> Any:
    genre_id = tmdb_client.resolve_genre_id(category_name, media_type)
    if genre_id is None:
        raise HTTPException(status_code=404, detail="Category not found")
    return await tmdb_client.get_category(media_type, genre_id)


@router.get("/{media_type}/{media_id}/trailer")
async def trailer(
    media_type: str,
    media_id: int,
    title: str | None = None,
    original_language: str | None = None,
) -> Any:
    if media_type not in {"movie", "tv"}:
        raise HTTPException(status_code=400, detail="media_type must be movie or tv")
    key = await tmdb_client.get_trailer_key(
        media_type, media_id, title=title, original_language=original_language
    )
    return {"key": key}


@router.get("/search")
async def search(q: str, page: int = Query(1, ge=1)) -> Any:
    return await tmdb_client.search(q, page)


@router.get("/{media_type}/{media_id}")
async def details(media_type: str, media_id: int) -> Any:
    if media_type not in {"movie", "tv"}:
        raise HTTPException(status_code=400, detail="media_type must be movie or tv")
    return await tmdb_client.get_details(media_type, media_id)
