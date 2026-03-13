from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file='.env', env_file_encoding='utf-8')

    APP_NAME: str = 'Discipline Sprint API'
    APP_ENV: str = 'development'
    APP_DEBUG: bool = True

    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = 'HS256'

    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    CORS_ALLOW_ORIGINS: str = '*'
    SCHEDULER_ENABLED: bool = True
    DEV_TIME_TRAVEL_KEY: str = 'local-seed-key-2026-03-13'


settings = Settings()
