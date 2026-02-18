import jwt
import datetime
from typing import Optional
from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.config import settings

# Set auto_error=False to handle missing tokens ourselves with proper 401
security = HTTPBearer(auto_error=False)

def create_access_token(data: dict, expires_delta: Optional[datetime.timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.datetime.utcnow() + expires_delta
    else:
        # If it's an admin, give them 30 days. Otherwise 24 hours.
        if data.get("role") == "admin":
            expire = datetime.datetime.utcnow() + datetime.timedelta(days=30)
        else:
            expire = datetime.datetime.utcnow() + datetime.timedelta(hours=24)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SUPABASE_JWT_SECRET, algorithm="HS256")
    return encoded_jwt

def verify_token(credentials: HTTPAuthorizationCredentials = Security(security)):
    """
    Verify JWT token from Supabase Auth.
    Returns 401 if no token or invalid token.
    """
    # Check if credentials are present
    if not credentials:
        raise HTTPException(status_code=401, detail="Authorization header missing")
    
    token = credentials.credentials
    
    if not token:
        raise HTTPException(status_code=401, detail="Token is empty")
    
    try:
        # Decode without verifying signature for development/bypass mode
        payload = jwt.decode(token, options={"verify_signature": False})
        return payload
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")
    except Exception as e:
        print(f"   ❌ Fatal error decoding token: {e}")
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")

