import json
import os
import urllib.request
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, status, Depends
from app.schemas import UserCreate, UserLogin, GoogleLoginRequest, UserOut, Token
from app.database import users_collection
from app.security import get_password_hash, verify_password, create_access_token, get_current_user


router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(user_data: UserCreate):
    email_clean = user_data.email.lower().strip()
    
    # Check if user already exists
    existing_user = users_collection.find_one({"email": email_clean})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email address is already registered"
        )
    
    # Hash password & construct user doc
    hashed_pwd = get_password_hash(user_data.password)
    now_iso = datetime.now(timezone.utc).isoformat()
    
    user_doc = {
        "full_name": user_data.full_name.strip(),
        "email": email_clean,
        "hashed_password": hashed_pwd,
        "role": user_data.role,
        "is_active": True,
        "created_at": now_iso
    }
    
    result = users_collection.insert_one(user_doc)
    user_id = str(result.inserted_id)
    
    # Generate JWT token
    access_token = create_access_token(data={"sub": email_clean})
    
    user_out = UserOut(
        id=user_id,
        full_name=user_doc["full_name"],
        email=email_clean,
        role=user_doc["role"],
        is_active=True,
        created_at=now_iso
    )
    
    return Token(access_token=access_token, token_type="bearer", user=user_out)


@router.post("/login", response_model=Token)
def login(login_data: UserLogin):
    email_clean = login_data.email.lower().strip()
    user = users_collection.find_one({"email": email_clean})
    
    if not user or not verify_password(login_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Check if account is active
    if not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated. Please contact support/administrator."
        )
    
    access_token = create_access_token(data={"sub": email_clean})
    
    user_out = UserOut(
        id=str(user["_id"]),
        full_name=user["full_name"],
        email=user["email"],
        role=user.get("role", "Elderly"),
        is_active=user.get("is_active", True),
        created_at=user.get("created_at"),
        phone=user.get("phone"),
        address=user.get("address")
    )
    
    return Token(access_token=access_token, token_type="bearer", user=user_out)


@router.post("/google", response_model=Token)
def google_login(data: GoogleLoginRequest):
    credential = data.credential
    if not credential:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google ID token credential is required."
        )
    
    # Verify Google ID token using Google TokenInfo API
    try:
        url = f"https://oauth2.googleapis.com/tokeninfo?id_token={credential}"
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req, timeout=10) as response:
            if response.status != 200:
                raise Exception("Token verification status error")
            payload_bytes = response.read()
            token_info = json.loads(payload_bytes.decode('utf-8'))
    except Exception as e:
        print("[AUTH ERROR] Google Token verification failed:", e)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired Google authentication token."
        )
    
    email = token_info.get("email")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google token payload does not contain an email address."
        )
    
    email_clean = email.lower().strip()
    full_name = token_info.get("name") or email_clean.split("@")[0].capitalize()
    picture = token_info.get("picture")
    google_sub = token_info.get("sub")
    
    user = users_collection.find_one({"email": email_clean})
    now_iso = datetime.now(timezone.utc).isoformat()
    
    if user:
        if not user.get("is_active", True):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your account has been deactivated. Please contact support/administrator."
            )
        update_fields = {}
        if google_sub and not user.get("google_id"):
            update_fields["google_id"] = google_sub
        if picture and not user.get("picture"):
            update_fields["picture"] = picture
        if update_fields:
            users_collection.update_one({"_id": user["_id"]}, {"$set": update_fields})
            user.update(update_fields)
    else:
        user_doc = {
            "full_name": full_name,
            "email": email_clean,
            "role": data.role or "Elderly",
            "is_active": True,
            "created_at": now_iso,
            "google_id": google_sub,
            "picture": picture,
            "auth_provider": "google"
        }
        result = users_collection.insert_one(user_doc)
        user = user_doc
        user["_id"] = result.inserted_id

    access_token = create_access_token(data={"sub": email_clean})
    
    user_out = UserOut(
        id=str(user["_id"]),
        full_name=user["full_name"],
        email=user["email"],
        role=user.get("role", "Elderly"),
        is_active=user.get("is_active", True),
        created_at=user.get("created_at"),
        phone=user.get("phone"),
        address=user.get("address")
    )
    
    return Token(access_token=access_token, token_type="bearer", user=user_out)



@router.get("/me", response_model=UserOut)
def get_me(current_user: dict = Depends(get_current_user)):
    return UserOut(
        id=current_user["id"],
        full_name=current_user["full_name"],
        email=current_user["email"],
        role=current_user.get("role", "Elderly"),
        is_active=current_user.get("is_active", True),
        created_at=current_user.get("created_at"),
        phone=current_user.get("phone"),
        address=current_user.get("address")
    )
