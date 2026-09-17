import os
from pathlib import Path
from dotenv import load_dotenv

# Explicitly load backend/.env
env_path = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

try:
    from pydantic_settings import BaseSettings, SettingsConfigDict

    class Settings(BaseSettings):
        DATABASE_URL: str = "sqlite:///./tracex.db"
        JWT_SECRET: str = "changeme"
        JWT_EXPIRE_MINUTES: int = 480
        AI_SUMMARY_API_KEY: str = "your_key_here"
        AI_SUMMARY_API_URL: str = "https://api.openai.com/v1/chat/completions"
        AI_SUMMARY_MODEL: str = "gpt-4o-mini"

        model_config = SettingsConfigDict(
            env_file=str(env_path),
            env_file_encoding="utf-8",
            extra="ignore",
        )
except ImportError:
    from pydantic import BaseSettings  # type: ignore

    class Settings(BaseSettings):  # type: ignore
        DATABASE_URL: str = "sqlite:///./tracex.db"
        JWT_SECRET: str = "changeme"
        JWT_EXPIRE_MINUTES: int = 480
        AI_SUMMARY_API_KEY: str = "your_key_here"
        AI_SUMMARY_API_URL: str = "https://api.openai.com/v1/chat/completions"
        AI_SUMMARY_MODEL: str = "gpt-4o-mini"

        class Config:
            env_file = str(env_path)
            extra = "ignore"

settings = Settings()
