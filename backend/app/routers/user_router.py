from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, Query, status

from app.schemas.user_schema import (
    UserCreateSchema, UserUpdateSchema, UserStatusUpdateSchema,
    UserResponseSchema, UserPaginatedResponseSchema
)
from app.services.user_service import UserService
from app.security import get_current_admin_user

router = APIRouter(prefix="/api/users", tags=["User Management"])

@router.get("", response_model=UserPaginatedResponseSchema)
def get_users(
    search: Optional[str] = Query(None, description="Search by name, email, or phone"),
    role: Optional[str] = Query(None, description="Filter by role (Admin, Elderly, Caregiver, Doctor, Family Member)"),
    status: Optional[str] = Query(None, description="Filter by status (active, inactive)"),
    sort_by: Optional[str] = Query("createdAt", description="Sort by field (name, createdAt, role, status)"),
    sort_order: Optional[str] = Query("desc", description="Sort order (asc, desc)"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(10, ge=1, le=100, description="Items per page (default 10)"),
    admin_user: dict = Depends(get_current_admin_user)
):
    """
    Get all users with search, filter, sorting, and pagination.
    """
    return UserService.get_users(
        search=search,
        role=role,
        status_filter=status,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        limit=limit
    )

@router.get("/search", response_model=UserPaginatedResponseSchema)
def search_users(
    q: Optional[str] = Query(None, description="Search query string for name, email, or phone"),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    admin_user: dict = Depends(get_current_admin_user)
):
    """
    Search users endpoint by Name, Email, or Phone.
    """
    return UserService.get_users(search=q, page=page, limit=limit)

@router.get("/{user_id}", response_model=UserResponseSchema)
def get_user_by_id(
    user_id: str,
    admin_user: dict = Depends(get_current_admin_user)
):
    """
    Get single user details by ID.
    """
    return UserService.get_user_by_id(user_id)

@router.post("", response_model=UserResponseSchema, status_code=status.HTTP_201_CREATED)
def create_user(
    user_data: UserCreateSchema,
    admin_user: dict = Depends(get_current_admin_user)
):
    """
    Create a new user with password hashing and email duplicate validation.
    """
    return UserService.create_user(user_data)

@router.put("/{user_id}", response_model=UserResponseSchema)
def update_user(
    user_id: str,
    update_data: UserUpdateSchema,
    admin_user: dict = Depends(get_current_admin_user)
):
    """
    Update existing user profile and credentials.
    """
    return UserService.update_user(user_id, update_data)

@router.patch("/{user_id}/status", response_model=UserResponseSchema)
def update_user_status(
    user_id: str,
    status_data: UserStatusUpdateSchema,
    admin_user: dict = Depends(get_current_admin_user)
):
    """
    Activate or deactivate a user account.
    """
    return UserService.update_user_status(user_id, status_data)

@router.delete("/{user_id}", response_model=dict)
def delete_user(
    user_id: str,
    admin_user: dict = Depends(get_current_admin_user)
):
    """
    Permanently delete a user account.
    """
    return UserService.delete_user(user_id)
