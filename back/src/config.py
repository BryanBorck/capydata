from functools import lru_cache
from typing import Literal
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict
from dotenv import load_dotenv

load_dotenv()

# Allowed environments where we want the interactive docs to be shown
SHOW_DOCS_ENVIRONMENT = {"development", "local"}


class Settings(BaseSettings):
    """Application settings loaded from environment variables or `.env` file."""

    # General application information
    app_name: str = Field("Datagotchi API", env="APP_NAME")
    app_version: str = Field("0.0.1", env="APP_VERSION")
    environment: Literal["development", "staging", "production", "local"] = Field(
        "development", env="ENVIRONMENT"
    )
    debug: bool = Field(False, env="DEBUG")
    data_dir: str = Field("data", env="DATA_DIR")
    images_dir: str = Field("data/images", env="IMAGES_DIR")

    # API KEYS
    NOTTE_API_KEY: str | None = Field(None, env="NOTTE_API_KEY")

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", case_sensitive=False)


@lru_cache()
def get_settings() -> "Settings":
    """Cache and return settings instance so that it is only created once."""

    return Settings()  # type: ignore[arg-type]


# Instantiate a global settings object that can be imported elsewhere
settings: Settings = get_settings() 