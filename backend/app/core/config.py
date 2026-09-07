from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "sqlite:///./netflix.db"
    secret_key: str = "super-secret-key-change-in-production"
    access_token_expire_minutes: int = 60 * 24 * 7  # 7 days
    algorithm: str = "HS256"
    tmdb_api_key: str = ""
    # Cookie settings: in production with frontend/backend on different domains
    # set COOKIE_SECURE=true and COOKIE_SAMESITE=none.
    cookie_secure: bool = False
    cookie_samesite: str = "lax"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


settings = Settings()
