from fastapi import FastAPI # Triggering reload v2
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from app.core.config import settings

from app.api.v1.api import api_router

app = FastAPI(
    title=settings.APP_NAME,
    debug=settings.DEBUG,
    version="1.0.0"
)

# Serve static files from the uploads directory
# Move uploads OUTSIDE of the backend folder to the project root
# This completely prevents uvicorn reload from seeing theme build files
from pathlib import Path
ROOT_DIR = Path(__file__).resolve().parents[1] # 0=app, 1=fastapi-backend
PROJECT_ROOT = ROOT_DIR.parent # Store-Builder
UPLOADS_DIR = PROJECT_ROOT / "uploads"

if not UPLOADS_DIR.exists():
    UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR), html=True), name="uploads")

# Comprehensive CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ],
    allow_origin_regex="http://(localhost|127\.0\.0\.1):.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Include API Router
app.include_router(api_router, prefix="/api/v1")

@app.get("/")
async def root():
    return {"message": f"Welcome to {settings.APP_NAME}"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
