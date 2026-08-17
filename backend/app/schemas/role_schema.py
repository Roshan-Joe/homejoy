from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class PermissionItemSchema(BaseModel):
    key: str
    label: str
    category: str

class RoleResponseSchema(BaseModel):
    id: str
    role_name: str
    description: str
    is_system_role: bool
    permissions: List[str]
    user_count: int
    createdAt: Optional[str] = None
    updatedAt: Optional[str] = None

class RolePermissionsUpdateSchema(BaseModel):
    permissions: List[str] = Field(..., description="List of permission strings to assign to this role")

class UserRoleChangeSchema(BaseModel):
    role: str = Field(..., example="Caregiver", description="New role to assign to the user")

class UserPermissionsResponseSchema(BaseModel):
    user_id: str
    role: str
    permissions: List[str]
