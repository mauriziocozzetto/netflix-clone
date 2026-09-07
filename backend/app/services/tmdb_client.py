from typing import Any

import httpx

from app.core.config import settings

BASE_URL = "https://api.themoviedb.org/3"


def _client() -> httpx.AsyncClient:
    return httpx.AsyncClient(base_url=BASE_URL, timeout=30.0)


def _params(extra: dict[str, Any] | None = None) -> dict[str, Any]:
    params = {"api_key": settings.tmdb_api_key, "language": "it-IT"}
    if extra:
        params.update(extra)
    return params


async def get_trending(media_type: str = "all", time_window: str = "week") -> dict[str, Any]:
    if media_type not in {"all", "movie", "tv"}:
        media_type = "all"
    async with _client() as client:
        response = await client.get(f"/trending/{media_type}/{time_window}", params=_params())
        response.raise_for_status()
        return response.json()


async def get_popular(media_type: str = "movie") -> dict[str, Any]:
    async with _client() as client:
        response = await client.get(f"/{media_type}/popular", params=_params())
        response.raise_for_status()
        return response.json()


async def get_category(media_type: str = "movie", genre_id: int = 28) -> dict[str, Any]:
    async with _client() as client:
        response = await client.get(
            f"/discover/{media_type}",
            params=_params({"with_genres": str(genre_id)}),
        )
        response.raise_for_status()
        return response.json()


async def get_details(media_type: str, media_id: int) -> dict[str, Any]:
    async with _client() as client:
        response = await client.get(f"/{media_type}/{media_id}", params=_params())
        response.raise_for_status()
        return response.json()


async def get_videos(media_type: str, media_id: int) -> dict[str, Any]:
    async with _client() as client:
        it_response = await client.get(
            f"/{media_type}/{media_id}/videos", params=_params({"language": "it-IT"})
        )
        it_response.raise_for_status()
        it_data = it_response.json()

        en_response = await client.get(
            f"/{media_type}/{media_id}/videos", params=_params({"language": "en-US"})
        )
        en_response.raise_for_status()
        en_data = en_response.json()

        # Merge results keeping Italian videos first, then English ones.
        seen_keys = set()
        merged = []
        for video in it_data.get("results", []) + en_data.get("results", []):
            key = video.get("key")
            if key and key not in seen_keys:
                seen_keys.add(key)
                merged.append(video)

        return {"id": it_data.get("id"), "results": merged}


def _normalize(text: str) -> str:
    return "".join(ch.lower() for ch in text if ch.isalnum() or ch.isspace())


def _title_matches(video_name: str, title: str | None) -> bool:
    if not title or not video_name:
        return False
    normalized_name = _normalize(video_name)
    # Use significant words from the title (>= 4 chars) to avoid matching generic words.
    significant = [w for w in _normalize(title).split() if len(w) >= 4]
    return any(word in normalized_name for word in significant)


def _pick_best_video(
    videos: list[dict[str, Any]], title: str | None = None, original_language: str | None = None
) -> dict[str, Any] | None:
    """Choose the most relevant trailer/youtube video."""
    yt = [v for v in videos if v.get("site") == "YouTube"]
    if not yt:
        return None

    def score(video: dict[str, Any]) -> int:
        s = 0
        name = video.get("name", "")
        is_trailer = video.get("type", "").lower() == "trailer"
        lang = video.get("iso_639_1", "")
        official = video.get("official") is True

        if is_trailer:
            s += 5
        if official:
            s += 3
        if _title_matches(name, title):
            s += 20
        if original_language and lang == original_language:
            s += 4
        elif lang == "it":
            s += 2
        elif lang == "en":
            s += 1
        return s

    return max(yt, key=score)


async def get_trailer_key(
    media_type: str, media_id: int, title: str | None = None, original_language: str | None = None
) -> str | None:
    data = await get_videos(media_type, media_id)
    video = _pick_best_video(data.get("results", []), title=title, original_language=original_language)
    return video.get("key") if video else None


async def search(query: str, page: int = 1) -> dict[str, Any]:
    async with _client() as client:
        response = await client.get(
            "/search/multi",
            params=_params({"query": query, "page": page}),
        )
        response.raise_for_status()
        return response.json()


# Genre name -> id mapping for common categories
GENRE_IDS = {
    "action": {"movie": 28, "tv": 10759},
    "adventure": {"movie": 12, "tv": 10759},
    "animation": {"movie": 16, "tv": 16},
    "comedy": {"movie": 35, "tv": 35},
    "crime": {"movie": 80, "tv": 80},
    "documentary": {"movie": 99, "tv": 99},
    "drama": {"movie": 18, "tv": 18},
    "family": {"movie": 10751, "tv": 10751},
    "fantasy": {"movie": 14, "tv": 10765},
    "history": {"movie": 36, "tv": 36},
    "horror": {"movie": 27, "tv": 9648},
    "music": {"movie": 10402, "tv": 10741},
    "mystery": {"movie": 9648, "tv": 9648},
    "romance": {"movie": 10749, "tv": 10749},
    "science_fiction": {"movie": 878, "tv": 10765},
    "thriller": {"movie": 53, "tv": 80},
    "war": {"movie": 10752, "tv": 10768},
    "western": {"movie": 37, "tv": 37},
}


def resolve_genre_id(category_name: str, media_type: str = "movie") -> int | None:
    key = category_name.lower().strip()
    mapping = GENRE_IDS.get(key)
    if not mapping:
        return None
    return mapping.get(media_type) or mapping.get("movie")
