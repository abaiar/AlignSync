from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "AlignSync"
    VERSION: str = "0.1.0"
    API_PREFIX: str = "/api/v1"
    DEBUG: bool = True

    DATABASE_URL: str = "sqlite+aiosqlite:///./alignsync.db"
    DATABASE_ECHO: bool = False

    # Security: explicit origin allowlist (never combine ["*"] with credentials).
    # Frontend is same-origin in production (served by this backend); dev uses the Vite proxy.
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
