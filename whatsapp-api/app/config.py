"""Application configuration."""

from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parents[1]
ENV_FILE = BASE_DIR / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(ENV_FILE),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "Hariom Fashion WhatsApp Assistant"
    app_env: str = "development"
    debug: bool = True
    api_prefix: str = ""

    database_url: str = "sqlite:///./data/whatsapp_commerce.db"
    node_sqlite_path: str = "../backend/data/fashion-virus.db"
    website_base_url: str = "http://localhost:3000"
    # Set to your ngrok/public URL so WhatsApp shows rich link preview cards (not raw localhost text)
    public_website_base_url: str = ""

    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"

    hypersender_api_key: str = ""
    hypersender_instance_id: str = ""
    hypersender_base_url: str = "https://app.hypersender.com/api/whatsapp/v2"
    hypersender_webhook_secret: str = ""

    max_products_per_reply: int = 2
    cache_ttl_seconds: int = 300
    brand_name: str = "Hariom Fashion"


@lru_cache
def get_settings() -> Settings:
    return Settings()


def reload_settings() -> Settings:
    """Clear cache and reload (e.g. after .env update)."""
    get_settings.cache_clear()
    return get_settings()
