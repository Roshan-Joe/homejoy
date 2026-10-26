import json
import os
import urllib.request
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, status, Depends
from app.schemas import UserCreate, UserLogin, GoogleLoginRequest, UserOut, Token
from app.database import users_collection
from app.security import get_password_hash, verify_password, create_access_token, get_current_user
from app.config import GOOGLE_CLIENT_ID


import time
from typing import Dict, List

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

# In-memory tracking for failed login attempts to support rate-limiting (429)
FAILED_LOGIN_ATTEMPTS: Dict[str, List[float]] = {}
MAX_LOGIN_ATTEMPTS = 5
LOCKOUT_WINDOW_SECONDS = 60

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(user_data: UserCreate):
    email_clean = user_data.email.lower().strip()
    
    # Check if user already exists
    existing_user = users_collection.find_one({"email": email_clean})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email address is already registered"
        )
    
    # Enforce role boundaries: Public self-registration is strictly restricted to Elderly.
    # Caregivers, Doctors, and Admin roles must be provisioned by System Administrator.
    requested_role = (user_data.role or "Elderly").strip()
    if requested_role.lower() != "elderly":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Self-registration for '{requested_role}' is restricted. Only Elderly accounts can be registered publicly. Caregiver and Administrator accounts must be created by an administrator."
        )
    canonical_role = "Elderly"

    # Hash password & construct user doc
    hashed_pwd = get_password_hash(user_data.password)
    now_iso = datetime.now(timezone.utc).isoformat()
    canonical_district = getattr(user_data, "district", None) or "Other"
    
    user_doc = {
        "full_name": user_data.full_name.strip(),
        "email": email_clean,
        "district": canonical_district,
        "hashed_password": hashed_pwd,
        "role": canonical_role,
        "is_active": True,
        "created_at": now_iso
    }
    
    result = users_collection.insert_one(user_doc)
    user_id = str(result.inserted_id)

    # If Elderly account registered, create the initial elderly resident profile with guardian details
    if canonical_role == "Elderly":
        from app.database import elderly_collection
        elderly_doc = {
            "user_id": user_id,
            "name": user_data.full_name.strip(),
            "full_name": user_data.full_name.strip(),
            "email": email_clean,
            "district": canonical_district,
            "guardian_name": user_data.guardian_name,
            "guardian_relationship": user_data.guardian_relationship or "Guardian",
            "guardian_phone": user_data.guardian_phone,
            "guardian_email": user_data.guardian_email,
            "guardian_report_consent": bool(user_data.guardian_report_consent),
            "guardian_report_enabled": bool(user_data.guardian_report_enabled if user_data.guardian_email else False),
            "assigned_caregiver_id": None,
            "assigned_caregiver_name": "Not Assigned",
            "assigned_doctor_id": None,
            "assigned_doctor_name": "Not Assigned",
            "ai_risk_score": 0.10,
            "risk_level": "Low",
            "createdAt": now_iso,
            "updatedAt": now_iso
        }
        elderly_collection.insert_one(elderly_doc)
    
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
    now = time.time()

    # Rate limiting & lockout guard
    attempts = FAILED_LOGIN_ATTEMPTS.get(email_clean, [])
    attempts = [t for t in attempts if now - t < LOCKOUT_WINDOW_SECONDS]
    FAILED_LOGIN_ATTEMPTS[email_clean] = attempts

    if len(attempts) >= MAX_LOGIN_ATTEMPTS:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many attempts, try again in a minute"
        )

    user = users_collection.find_one({"email": email_clean})
    
    if not user or not verify_password(login_data.password, user.get("hashed_password", "")):
        FAILED_LOGIN_ATTEMPTS[email_clean].append(now)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email or password is incorrect",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Reset failed attempts on successful login
    if email_clean in FAILED_LOGIN_ATTEMPTS:
        FAILED_LOGIN_ATTEMPTS.pop(email_clean, None)
    
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

    # Verify that aud matches configured Google Client ID to prevent token substitution attacks
    token_aud = token_info.get("aud")
    expected_aud = GOOGLE_CLIENT_ID.strip() if GOOGLE_CLIENT_ID else None
    if not token_aud or (expected_aud and token_aud != expected_aud):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google authentication token: audience (aud) does not match this application's client ID."
        )

    # Verify that email is verified by Google
    email_verified = token_info.get("email_verified")
    if email_verified is not True and str(email_verified).lower() != "true":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Google account email address is not verified."
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
        # Enforce role boundaries on public Google signup: Only Elderly or Caregiver
        requested_role = (data.role or "Elderly").strip()
        clean_role_lower = requested_role.lower()
        if clean_role_lower not in ["elderly", "caregiver"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Registration for '{requested_role}' is restricted. Only Elderly and Caregiver accounts can register. Admin and other roles must be provisioned by an Administrator."
            )
        google_role = "Caregiver" if clean_role_lower == "caregiver" else "Elderly"

        user_doc = {
            "full_name": full_name,
            "email": email_clean,
            "role": google_role,
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
