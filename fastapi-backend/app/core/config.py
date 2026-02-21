from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # Supabase Key and URL
    SUPABASE_URL: Union[str, None] = None
    SUPABASE_KEY: Union[str, None] = None
    SUPABASE_SERVICE_KEY: Union[str, None] = None
    SUPABASE_JWT_SECRET: Union[str, None] = None
    
    # Database
    DATABASE_URL: Union[str, None] = None
    
    # Razorpay
    RAZORPAY_KEY_ID: Union[str, None] = None
    RAZORPAY_KEY_SECRET: Union[str, None] = None
    
    # Cloudinary - Optional
    CLOUDINARY_CLOUD_NAME: Union[str, None] = None
    CLOUDINARY_API_KEY: Union[str, None] = None
    CLOUDINARY_API_SECRET: Union[str, None] = None
    
    # App Settings
    APP_NAME: str = "StoreCraft API"
    DEBUG: bool = True
    
    # This will handle both a real list and a comma-separated string
    CORS_ORIGINS: Union[str, List[str]] = ["http://localhost:3000"]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, list):
            return v
        return v
    
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
