from pydantic_settings import BaseSettings
from typing import List, Union
import os
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    # Application
    app_name: str = "Credit Risk Assessment System"
    app_version: str = "2.0.0"
    debug: bool = True
    
    # Security
    secret_key: str = os.getenv("SECRET_KEY", "change-this-secret-key")
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # Database
    database_url: str = os.getenv("DATABASE_URL", "postgresql://creditrisk:password@localhost:5432/creditrisk_db")
    
    # Redis
    redis_url: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    
    # Model
    model_path: str = os.getenv("MODEL_PATH", "credit_risk_model.pkl")
    
    # API
    api_prefix: str = "/api/v1"
    cors_origins: Union[List[str], str] = ["http://localhost:3000", "http://localhost:8000"]
    
    # Monitoring
    metrics_enabled: bool = True
    log_level: str = "INFO"
    
    def get_cors_origins(self) -> List[str]:
        """Get CORS origins as a list"""
        if isinstance(self.cors_origins, str):
            return [origin.strip() for origin in self.cors_origins.split(',')]
        return self.cors_origins
    
    class Config:
        case_sensitive = False
        env_file = ".env"

settings = Settings()