from fastapi import APIRouter, File, UploadFile, HTTPException, Form, Depends
from app.core.config import settings
import cloudinary
import cloudinary.uploader

router = APIRouter()

# Cloudinary will be configured lazily inside functions when needed

@router.post("/")
async def upload_file(file: UploadFile = File(...), folder: str = Form("uploads")):
    """
    Upload a file to Cloudinary
    """
    try:
        if not settings.CLOUDINARY_CLOUD_NAME or not settings.CLOUDINARY_API_KEY:
             raise HTTPException(status_code=500, detail="Cloudinary configuration missing. Please check .env file.")

        # Configure Cloudinary lazily
        cloudinary.config(
            cloud_name=settings.CLOUDINARY_CLOUD_NAME,
            api_key=settings.CLOUDINARY_API_KEY,
            api_secret=settings.CLOUDINARY_API_SECRET
        )

        # Read file content
        content = await file.read()
        
        # Upload to Cloudinary
        result = cloudinary.uploader.upload(
            content,
            folder=folder,
            resource_type="auto"
        )
        
        return {
            "success": True,
            "data": {
                "url": result.get("secure_url"),
                "publicId": result.get("public_id"),
                "width": result.get("width"),
                "height": result.get("height"),
                "format": result.get("format"),
                "size": result.get("bytes")
            }
        }
    except Exception as e:
        print(f"Cloudinary upload error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{public_id:path}")
async def delete_file(public_id: str):
    """
    Delete a file from Cloudinary
    """
    try:
        # Validate Cloudinary configuration
        if not settings.CLOUDINARY_CLOUD_NAME or not settings.CLOUDINARY_API_KEY:
             raise HTTPException(status_code=500, detail="Cloudinary configuration missing. Please check .env file.")
        
        # Configure Cloudinary lazily
        cloudinary.config(
            cloud_name=settings.CLOUDINARY_CLOUD_NAME,
            api_key=settings.CLOUDINARY_API_KEY,
            api_secret=settings.CLOUDINARY_API_SECRET
        )
        
        result = cloudinary.uploader.destroy(public_id)
        
        if result.get("result") == "ok":
             return {"success": True, "message": "File deleted"}
        else:
             print(f"Delete failed: {result}")
             # Cloudinary returns 'not found' as result='not found' sometimes, but status 200.
             return {"success": False, "error": result.get("result")}

    except Exception as e:
         print(f"Cloudinary delete error: {e}")
         raise HTTPException(status_code=500, detail=str(e))
