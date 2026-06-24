from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class UserCreate(BaseModel):
    username: str
    password: str
    real_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    enterprise_id: int
    role_ids: List[int] = []


class UserUpdate(BaseModel):
    real_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    is_active: Optional[bool] = None
    role_ids: Optional[List[int]] = None


class UserResponse(BaseModel):
    id: int
    username: str
    real_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    enterprise_id: int
    is_active: bool
    roles: List[str] = []
    created_at: Optional[datetime] = None


class RoleResponse(BaseModel):
    id: int
    name: str
    display_name: str
    enterprise_type: Optional[str] = None
    description: Optional[str] = None


class PermissionResponse(BaseModel):
    id: int
    code: str
    name: str
    module: Optional[str] = None
    description: Optional[str] = None


class RoleCreate(BaseModel):
    name: str
    display_name: str
    enterprise_type: Optional[str] = None
    description: Optional[str] = None
    permission_ids: List[int] = []
