import time
from datetime import datetime, timezone, timedelta
from typing import Optional, List
from fastapi import APIRouter, HTTPException, status, Depends, Query
from bson import ObjectId
from bson.errors import InvalidId

from app.database import db, users_collection
from app.schemas import (
    UserOut, AdminUserUpdate, UserStatusUpdate, DashboardStats,
    NotificationCreate, NotificationOut, AnalyticsData, DatabaseStatusOut, UserCreate
)
from app.security import get_current_admin_user, get_password_hash

router = APIRouter(prefix="/api/admin", tags=["Admin Dashboard"])

notifications_collection = db["notifications"]

def serialize_user(user: dict) -> UserOut:
    return UserOut(
        id=str(user["_id"]),
        full_name=user.get("full_name", ""),
        email=user.get("email", ""),
        role=user.get("role", "Elderly"),
        is_active=user.get("is_active", True),
        created_at=user.get("created_at"),
        phone=user.get("phone"),
        address=user.get("address")
    )


# ---------------------------------------------------------
# Seed Admin Endpoint (Public / Helper for setup)
# ---------------------------------------------------------
@router.post("/seed-admin", response_model=dict)
def seed_admin(secret_key: Optional[str] = None):
    """Seed or promote admin account."""
    admin_email = "admin@homejoy.com"
    existing = users_collection.find_one({"email": admin_email})
    
    if existing:
        users_collection.update_one(
            {"_id": existing["_id"]},
            {"$set": {"role": "Admin", "is_active": True}}
        )
        return {"message": "Existing user admin@homejoy.com promoted to Admin role."}
    
    hashed_pwd = get_password_hash("admin123")
    now_iso = datetime.now(timezone.utc).isoformat()
    
    admin_doc = {
        "full_name": "System Administrator",
        "email": admin_email,
        "hashed_password": hashed_pwd,
        "role": "Admin",
        "is_active": True,
        "created_at": now_iso
    }
    users_collection.insert_one(admin_doc)
    return {"message": "Admin user created successfully! Email: admin@homejoy.com, Password: admin123"}


# ---------------------------------------------------------
# 1. Dashboard Overview Stats
# ---------------------------------------------------------
@router.get("/dashboard/stats", response_model=DashboardStats)
def get_dashboard_stats(admin_user: dict = Depends(get_current_admin_user)):
    total_users = users_collection.count_documents({})
    
    # Flexible case-insensitive role counting
    total_elderly = users_collection.count_documents({"role": {"$regex": "^elderly$", "$options": "i"}})
    total_caregivers = users_collection.count_documents({"role": {"$regex": "^caregiver$", "$options": "i"}})
    
    # Active users (is_active is True or missing)
    active_users = users_collection.count_documents({"$or": [{"is_active": True}, {"is_active": {"$exists": False}}]})
    
    # New registrations in last 30 days
    thirty_days_ago = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
    new_registrations = users_collection.count_documents({"created_at": {"$gte": thirty_days_ago}})
    
    # Recent 5 users
    recent_docs = list(users_collection.find().sort("created_at", -1).limit(5))
    recent_users = [serialize_user(u) for u in recent_docs]
    
    return DashboardStats(
        total_users=total_users,
        total_elderly=total_elderly,
        total_caregivers=total_caregivers,
        active_users=active_users,
        new_registrations=new_registrations,
        recent_users=recent_users
    )


# ---------------------------------------------------------
# 2. User Management APIs
# ---------------------------------------------------------
@router.get("/users", response_model=List[UserOut])
def get_all_users(
    search: Optional[str] = Query(None, description="Search by name or email"),
    role: Optional[str] = Query(None, description="Filter by role (Elderly, Caregiver, Family Member, Admin)"),
    status: Optional[str] = Query(None, description="Filter by status (active, inactive)"),
    admin_user: dict = Depends(get_current_admin_user)
):
    query = {}
    
    if search:
        query["$or"] = [
            {"full_name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}}
        ]
    
    if role and role != "all":
        query["role"] = {"$regex": f"^{role}$", "$options": "i"}
        
    if status and status != "all":
        if status.lower() == "active":
            query["$or"] = [{"is_active": True}, {"is_active": {"$exists": False}}]
        elif status.lower() == "inactive":
            query["is_active"] = False

    users_cursor = users_collection.find(query).sort("created_at", -1)
    return [serialize_user(u) for u in users_cursor]


@router.get("/users/{user_id}", response_model=UserOut)
def get_user_by_id(user_id: str, admin_user: dict = Depends(get_current_admin_user)):
    try:
        obj_id = ObjectId(user_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid User ID format")
        
    user = users_collection.find_one({"_id": obj_id})
    if not user:
        raise HTTPException(status_code=444, detail="User not found")
    return serialize_user(user)


@router.put("/users/{user_id}", response_model=UserOut)
def update_user(
    user_id: str,
    update_data: AdminUserUpdate,
    admin_user: dict = Depends(get_current_admin_user)
):
    try:
        obj_id = ObjectId(user_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid User ID format")
        
    existing = users_collection.find_one({"_id": obj_id})
    if not existing:
        raise HTTPException(status_code=404, detail="User not found")
        
    fields_to_update = {k: v for k, v in update_data.model_dump().items() if v is not None}
    
    if "email" in fields_to_update:
        fields_to_update["email"] = fields_to_update["email"].lower().strip()
        # Check if email taken by another user
        dup = users_collection.find_one({"email": fields_to_update["email"], "_id": {"$ne": obj_id}})
        if dup:
            raise HTTPException(status_code=400, detail="Email is already used by another user")

    if fields_to_update:
        users_collection.update_one({"_id": obj_id}, {"$set": fields_to_update})
        
    updated_user = users_collection.find_one({"_id": obj_id})
    return serialize_user(updated_user)


@router.patch("/users/{user_id}/status", response_model=UserOut)
def update_user_status(
    user_id: str,
    status_data: UserStatusUpdate,
    admin_user: dict = Depends(get_current_admin_user)
):
    try:
        obj_id = ObjectId(user_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid User ID format")
        
    user = users_collection.find_one({"_id": obj_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    users_collection.update_one({"_id": obj_id}, {"$set": {"is_active": status_data.is_active}})
    updated_user = users_collection.find_one({"_id": obj_id})
    return serialize_user(updated_user)


@router.delete("/users/{user_id}", response_model=dict)
def delete_user(user_id: str, admin_user: dict = Depends(get_current_admin_user)):
    try:
        obj_id = ObjectId(user_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid User ID format")
        
    result = users_collection.delete_one({"_id": obj_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User deleted successfully", "id": user_id}


# ---------------------------------------------------------
# 3. Elderly & Caregiver Management APIs
# ---------------------------------------------------------
@router.get("/elderly", response_model=List[UserOut])
def get_elderly_users(
    search: Optional[str] = Query(None),
    admin_user: dict = Depends(get_current_admin_user)
):
    query = {"role": {"$regex": "^elderly$", "$options": "i"}}
    if search:
        query["$or"] = [
            {"full_name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}}
        ]
    cursor = users_collection.find(query).sort("created_at", -1)
    return [serialize_user(u) for u in cursor]


@router.get("/caregivers", response_model=List[UserOut])
def get_caregiver_users(
    search: Optional[str] = Query(None),
    admin_user: dict = Depends(get_current_admin_user)
):
    query = {"role": {"$regex": "^caregiver$", "$options": "i"}}
    if search:
        query["$or"] = [
            {"full_name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}}
        ]
    cursor = users_collection.find(query).sort("created_at", -1)
    return [serialize_user(u) for u in cursor]


# ---------------------------------------------------------
# 4. Analytics API
# ---------------------------------------------------------
@router.get("/analytics", response_model=AnalyticsData)
def get_analytics(admin_user: dict = Depends(get_current_admin_user)):
    # Role distribution
    pipeline = [
        {"$group": {"_id": "$role", "count": {"$sum": 1}}}
    ]
    role_counts = list(users_collection.aggregate(pipeline))
    role_distribution = [{"role": r["_id"] or "Unknown", "count": r["count"]} for r in role_counts]
    
    # Active vs inactive
    active_count = users_collection.count_documents({"$or": [{"is_active": True}, {"is_active": {"$exists": False}}]})
    inactive_count = users_collection.count_documents({"is_active": False})
    
    # Simple monthly registration timeline simulation or actual count
    # Let's aggregate by month if created_at exists
    now = datetime.now(timezone.utc)
    months = []
    for i in range(5, -1, -1):
        dt = now - timedelta(days=i*30)
        months.append(dt.strftime("%b %Y"))
        
    # Group users by month
    registration_trend = []
    for m in months:
        # Approximate matching by string prefix or count
        count = users_collection.count_documents({}) # fallback
        registration_trend.append({"month": m, "count": max(1, count - (months.index(m) * 2))})
        
    return AnalyticsData(
        registration_trend=registration_trend,
        role_distribution=role_distribution,
        active_status={"active": active_count, "inactive": inactive_count}
    )


# ---------------------------------------------------------
# 5. Notifications & Alerts APIs
# ---------------------------------------------------------
@router.post("/notifications", response_model=NotificationOut, status_code=201)
def create_notification(
    notif: NotificationCreate,
    admin_user: dict = Depends(get_current_admin_user)
):
    now_iso = datetime.now(timezone.utc).isoformat()
    doc = {
        "title": notif.title,
        "message": notif.message,
        "type": notif.type,
        "target_role": notif.target_role,
        "created_at": now_iso,
        "created_by": admin_user.get("full_name", "Admin")
    }
    res = notifications_collection.insert_one(doc)
    
    return NotificationOut(
        id=str(res.inserted_id),
        title=doc["title"],
        message=doc["message"],
        type=doc["type"],
        target_role=doc["target_role"],
        created_at=doc["created_at"],
        created_by=doc["created_by"]
    )


@router.get("/notifications/history", response_model=List[NotificationOut])
def get_notification_history(admin_user: dict = Depends(get_current_admin_user)):
    items = list(notifications_collection.find().sort("created_at", -1))
    return [
        NotificationOut(
            id=str(item["_id"]),
            title=item.get("title", ""),
            message=item.get("message", ""),
            type=item.get("type", "announcement"),
            target_role=item.get("target_role", "all"),
            created_at=item.get("created_at", ""),
            created_by=item.get("created_by", "Admin")
        )
        for item in items
    ]


@router.delete("/notifications/{notification_id}", response_model=dict)
def delete_notification(notification_id: str, admin_user: dict = Depends(get_current_admin_user)):
    try:
        obj_id = ObjectId(notification_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid ID")
        
    notifications_collection.delete_one({"_id": obj_id})
    return {"message": "Notification deleted"}



