from typing import List, Dict, Any
from fastapi import APIRouter, Depends, status

from app.schemas.role_schema import (
    RoleResponseSchema, RolePermissionsUpdateSchema,
    UserRoleChangeSchema, UserPermissionsResponseSchema
)
from app.schemas.user_schema import UserResponseSchema
from app.services.role_service import RoleService
from app.security import get_current_admin_user

router = APIRouter(prefix="/api/roles", tags=["Role Management & RBAC"])

@router.get("", response_model=List[RoleResponseSchema])
def get_all_roles(admin_user: dict = Depends(get_current_admin_user)):
    """
    Get all system roles, descriptions, permission lists, and active user counts.
    """
    return RoleService.get_all_roles()

@router.get("/permissions-catalog", response_model=List[Dict[str, str]])
def get_permissions_catalog(admin_user: dict = Depends(get_current_admin_user)):
    """
    Get all available system permissions categorized.
    """
    return RoleService.get_all_permissions_catalog()

@router.get("/{role_name}", response_model=RoleResponseSchema)
def get_role_by_name(role_name: str, admin_user: dict = Depends(get_current_admin_user)):
    """
    Get detailed permissions for a specific role by name.
    """
    return RoleService.get_role_by_name(role_name)

@router.put("/{role_name}/permissions", response_model=RoleResponseSchema)
def update_role_permissions(
    role_name: str,
    payload: RolePermissionsUpdateSchema,
    admin_user: dict = Depends(get_current_admin_user)
):
    """
    Update permission set assigned to a specific role.
    """
    return RoleService.update_role_permissions(role_name, payload)

@router.patch("/assign-user/{user_id}", response_model=UserResponseSchema)
def assign_user_role(
    user_id: str,
    payload: UserRoleChangeSchema,
    admin_user: dict = Depends(get_current_admin_user)
):
    """
    Assign or change a user's role.
    """
    return RoleService.assign_user_role(user_id, payload)

@router.get("/user-permissions/{user_id}", response_model=UserPermissionsResponseSchema)
def get_user_permissions(
    user_id: str,
    admin_user: dict = Depends(get_current_admin_user)
):
    """
    Get computed effective permissions for a user based on their assigned role.
    """
    return RoleService.get_user_permissions(user_id)
