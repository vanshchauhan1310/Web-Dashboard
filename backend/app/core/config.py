from typing import List, Optional
from urllib.parse import quote_plus

from pydantic import model_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "Enterprise Analytics Dashboard Platform"
    API_V1_STR: str = "/api/v1"
    DATABASE_URL: Optional[str] = None
    SECRET_KEY: str = "changeme-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480

    # Comma-separated list of allowed CORS origins, e.g.:
    #   ALLOWED_ORIGINS=https://my-app.vercel.app,https://app.example.com
    # Defaults to localhost for local dev.
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    user: Optional[str] = None
    password: Optional[str] = None
    host: Optional[str] = None
    port: Optional[int] = None
    dbname: Optional[str] = None

    model_config = {
        "env_file": ".env",
        "extra": "allow",
    }

    @property
    def allowed_origins_list(self) -> List[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",") if o.strip()]

    @model_validator(mode="before")
    def assemble_database_url(cls, values):
        if not values:
            return values

        if not values.get("DATABASE_URL"):
            user = values.get("user")
            password = values.get("password")
            host = values.get("host")
            port = values.get("port")
            dbname = values.get("dbname")

            if user and password and host and port and dbname:
                user = quote_plus(str(user))
                password = quote_plus(str(password))
                values["DATABASE_URL"] = (
                    f"postgresql+asyncpg://{user}:{password}@{host}:{port}/{dbname}"
                )

        return values


settings = Settings()
