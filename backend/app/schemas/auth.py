from typing import List, Optional

from pydantic import BaseModel


class LoginRequest(BaseModel):
    username: str
    password: str


class UserInfo(BaseModel):
    id: int
    username: str
    real_name: Optional[str] = None
    enterprise_id: int
    enterprise_name: Optional[str] = None
    enterprise_type: Optional[str] = None
    roles: List[str] = []
    permissions: List[str] = []


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserInfo
