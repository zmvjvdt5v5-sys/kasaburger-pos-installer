"""User and Auth Models"""
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: Optional[str] = None
    role: Optional[str] = "user"

class UserLogin(BaseModel):
    email: EmailStr
    password: str
    captcha_answer: Optional[str] = None

class TwoFactorVerify(BaseModel):
    email: str
    code: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: Optional[str] = None
    role: str
    two_factor_enabled: Optional[bool] = False
    created_at: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str
