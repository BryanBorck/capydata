from functools import lru_cache
from typing import Literal
from pydantic import Field, computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict
from dotenv import load_dotenv

load_dotenv()

# Allowed environments where we want the interactive docs to be shown
SHOW_DOCS_ENVIRONMENT = {"development", "staging", "production", "local"}


class Settings(BaseSettings):
    """Application settings loaded from environment variables or `.env` file."""

    # General application information
    app_name: str = Field("Datagotchi API", env="APP_NAME")
    app_version: str = Field("0.0.1", env="APP_VERSION")
    environment: Literal["development", "staging", "production", "local"] = Field(
        "development", env="ENVIRONMENT"
    )
    # New APP_ENV field to distinguish between dev and prod Supabase
    app_env: Literal["development", "production"] = Field(
        "development", env="APP_ENV"
    )
    debug: bool = Field(False, env="DEBUG")
    data_dir: str = Field("data", env="DATA_DIR")
    images_dir: str = Field("data/images", env="IMAGES_DIR")

    # API KEYS
    NOTTE_API_KEY: str | None = Field(None, env="NOTTE_API_KEY")
    
    # Development Supabase configuration
    supabase_url_dev: str | None = Field(None, env="SUPABASE_URL")
    supabase_key_dev: str | None = Field(None, env="SUPABASE_KEY")
    
    # Production Supabase configuration
    supabase_url_prod: str | None = Field(None, env="SUPABASE_URL_PROD")
    supabase_key_prod: str | None = Field(None, env="SUPABASE_KEY_PROD")

    model_config = SettingsConfigDict(
        env_file=".env", 
        env_file_encoding="utf-8", 
        case_sensitive=False,
        extra="ignore"  # Allow extra environment variables to be ignored
    )

    @computed_field
    @property
    def supabase_url(self) -> str | None:
        """Get the appropriate Supabase URL based on APP_ENV."""
        if self.app_env == "production":
            return self.supabase_url_prod
        return self.supabase_url_dev

    @computed_field
    @property
    def supabase_key(self) -> str | None:
        """Get the appropriate Supabase key based on APP_ENV."""
        if self.app_env == "production":
            return self.supabase_key_prod
        return self.supabase_key_dev

    @computed_field
    @property
    def is_production(self) -> bool:
        """Check if the app is running in production mode."""
        return self.app_env == "production"

    @computed_field
    @property
    def is_development(self) -> bool:
        """Check if the app is running in development mode."""
        return self.app_env == "development"


@lru_cache()
def get_settings() -> "Settings":
    """Cache and return settings instance so that it is only created once."""

    return Settings()  # type: ignore[arg-type]


# Instantiate a global settings object that can be imported elsewhere
settings: Settings = get_settings() 