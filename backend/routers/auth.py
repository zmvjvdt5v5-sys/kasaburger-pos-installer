"""Authentication Router"""
import uuid
import random
import string
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends, Request
from typing import Optional

from models.user import UserCreate, UserLogin, TwoFactorVerify, UserResponse, TokenResponse, ChangePasswordRequest
from utils.auth import hash_password, verify_password, create_token, get_current_user
from utils.database import get_db

router = APIRouter(prefix="/auth", tags=["Authentication"])

def generate_2fa_code() -> str:
    return ''.join(random.choices(string.digits, k=6))

def generate_captcha() -> dict:
    num1 = random.randint(1, 10)
    num2 = random.randint(1, 10)
    captcha_id = str(uuid.uuid4())
    return {
        "id": captcha_id,
        "question": f"{num1} + {num2} = ?",
        "answer": str(num1 + num2)
    }

@router.post("/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Bu email zaten kayıtlı")
    
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "email": user_data.email,
        "password": hash_password(user_data.password),
        "name": user_data.name,
        "role": user_data.role or "user",
        "two_factor_enabled": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_doc)
    
    token = create_token(user_id, user_data.email, user_doc["role"])
    
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user_id,
            email=user_data.email,
            name=user_data.name,
            role=user_doc["role"]
        )
    )

@router.get("/captcha")
async def get_captcha():
    db = get_db()
    captcha = generate_captcha()
    if db is not None:
        await db.captchas.insert_one({
            "id": captcha["id"],
            "answer": captcha["answer"],
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    return {"id": captcha["id"], "question": captcha["question"]}

@router.post("/login")
async def login(credentials: UserLogin, request: Request, captcha_id: Optional[str] = None):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    user = await db.users.find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Geçersiz email veya şifre")
    
    # 2FA kontrolü
    if user.get("two_factor_enabled"):
        code = generate_2fa_code()
        await db.two_factor_codes.insert_one({
            "email": credentials.email,
            "code": code,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "used": False
        })
        return {"requires_2fa": True, "message": "2FA kodu email adresinize gönderildi"}
    
    token = create_token(user["id"], user["email"], user.get("role", "user"))
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "email": user["email"],
            "name": user.get("name"),
            "role": user.get("role", "user"),
            "two_factor_enabled": user.get("two_factor_enabled", False)
        }
    }

@router.post("/verify-2fa")
async def verify_2fa(data: TwoFactorVerify, request: Request):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    code_doc = await db.two_factor_codes.find_one({
        "email": data.email,
        "code": data.code,
        "used": False
    })
    
    if not code_doc:
        raise HTTPException(status_code=401, detail="Geçersiz veya süresi dolmuş kod")
    
    await db.two_factor_codes.update_one(
        {"_id": code_doc["_id"]},
        {"$set": {"used": True}}
    )
    
    user = await db.users.find_one({"email": data.email})
    token = create_token(user["id"], user["email"], user.get("role", "user"))
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "email": user["email"],
            "name": user.get("name"),
            "role": user.get("role", "user")
        }
    }

@router.post("/toggle-2fa")
async def toggle_2fa(current_user: dict = Depends(get_current_user)):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    user = await db.users.find_one({"id": current_user["user_id"]})
    new_status = not user.get("two_factor_enabled", False)
    
    await db.users.update_one(
        {"id": current_user["user_id"]},
        {"$set": {"two_factor_enabled": new_status}}
    )
    
    return {"two_factor_enabled": new_status}

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    db = get_db()
    if db is None:
        return UserResponse(
            id=current_user["user_id"],
            email=current_user["email"],
            role=current_user.get("role", "user")
        )
    
    user = await db.users.find_one({"id": current_user["user_id"]}, {"_id": 0, "password": 0})
    if user:
        return UserResponse(**user)
    
    return UserResponse(
        id=current_user["user_id"],
        email=current_user["email"],
        role=current_user.get("role", "user")
    )

@router.put("/change-password")
async def change_password(req: ChangePasswordRequest, current_user: dict = Depends(get_current_user)):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    user = await db.users.find_one({"id": current_user["user_id"]})
    if not user:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")
    
    if not verify_password(req.current_password, user["password"]):
        raise HTTPException(status_code=400, detail="Mevcut şifre yanlış")
    
    await db.users.update_one(
        {"id": current_user["user_id"]},
        {"$set": {"password": hash_password(req.new_password)}}
    )
    
    return {"message": "Şifre başarıyla değiştirildi"}
