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

class SmartStaticFiles(StaticFiles):
    """Custom static file handler to properly resolve Next.js static exports."""
    async def get_response(self, path: str, scope):
        # 1. Normalize path to use forward slashes (fixes Windows backslash issues)
        path = path.replace("\\", "/")
        
        # 2. Try the standard file first
        response = await super().get_response(path, scope)
        
        # 3. If 404, try appending .html (Next.js clean urls: /login -> /login.html)
        if response.status_code == 404 and not path.endswith(".html"):
            html_path = f"{path}.html"
            response = await super().get_response(html_path, scope)
            
        # 4. If still 404, try path/index.html (Next.js directory exports: /login -> /login/index.html)
        if response.status_code == 404:
            # Manually construct path with forward slash to avoid os.path.join using backslashes
            if path.endswith("/"):
                index_path = f"{path}index.html"
            else:
                index_path = f"{path}/index.html"
            response = await super().get_response(index_path, scope)
            
        return response

app.mount("/uploads", SmartStaticFiles(directory=str(UPLOADS_DIR), html=True), name="uploads")

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
