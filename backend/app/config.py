from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    psn_region: str = "en-US"
    psn_deals_category_id: str = "44d8bb20-653e-431e-8ad0-c0a365f68d2f"
    psn_category_grid_hash: str = (
        "4ce7d4ce7a2a43fdf1dc4a8d93aa0cb087897d19ff0a7d7df6e3c829e79ec176"
    )
    database_url: str = "sqlite:///./apipsn.db"


settings = Settings()
