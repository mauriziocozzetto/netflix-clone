import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from app.api import auth, favorites, tmdb
from app.core.database import init_db
from app.models import favorite, user  # noqa: F401 - register models


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


allowed_origins = [
    origin.strip()
    for origin in os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")
    if origin.strip()
]

app = FastAPI(title="Netflix Clone API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(tmdb.router)
app.include_router(favorites.router)


@app.get("/health", tags=["health"])
def health_check():
    return {"status": "ok"}


# Serve il frontend React buildato quando viene fornita la cartella di distribuzione.
# In produzione su Render il backend e il frontend girano sullo stesso dominio,
# quindi non servono chiamate cross-origin nè CORS aggiuntivi.
_frontend_dist = os.getenv("FRONTEND_DIST_PATH", "")
if _frontend_dist:
    dist_dir = Path(_frontend_dist)
    if dist_dir.is_dir():
        @app.get("/{full_path:path}")
        async def serve_spa(full_path: str):
            file_path = dist_dir / full_path
            if file_path.is_file():
                return FileResponse(file_path)
            return FileResponse(dist_dir / "index.html")
