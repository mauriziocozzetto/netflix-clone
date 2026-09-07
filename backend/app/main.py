import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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
