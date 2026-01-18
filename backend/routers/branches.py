"""Branches Router - Şube Yönetimi"""
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from pydantic import BaseModel

from utils.auth import get_current_user
from utils.database import get_db

router = APIRouter(prefix="/branches", tags=["Branches"])

class BranchCreate(BaseModel):
    name: str
    code: str
    address: str
    phone: Optional[str] = None
    manager_name: Optional[str] = None
    manager_email: Optional[str] = None

class BranchResponse(BaseModel):
    id: str
    name: str
    code: str
    address: str
    phone: Optional[str] = None
    manager_name: Optional[str] = None
    manager_email: Optional[str] = None
    status: str = "active"
    created_at: Optional[str] = None

@router.post("", response_model=BranchResponse)
async def create_branch(branch: BranchCreate, current_user: dict = Depends(get_current_user)):
    db = get_db()
    if not db:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    existing = await db.branches.find_one({"code": branch.code})
    if existing:
        raise HTTPException(status_code=400, detail="Bu şube kodu zaten mevcut")
    
    branch_doc = {
        "id": str(uuid.uuid4()),
        **branch.model_dump(),
        "status": "active",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.branches.insert_one(branch_doc)
    branch_doc.pop("_id", None)
    return BranchResponse(**branch_doc)

@router.get("", response_model=List[BranchResponse])
async def get_branches(current_user: dict = Depends(get_current_user)):
    db = get_db()
    if not db:
        return []
    branches = await db.branches.find({}, {"_id": 0}).to_list(100)
    return [BranchResponse(**b) for b in branches]

@router.get("/{branch_id}", response_model=BranchResponse)
async def get_branch(branch_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    if not db:
        raise HTTPException(status_code=404, detail="Şube bulunamadı")
    branch = await db.branches.find_one({"id": branch_id}, {"_id": 0})
    if not branch:
        raise HTTPException(status_code=404, detail="Şube bulunamadı")
    return BranchResponse(**branch)

@router.put("/{branch_id}", response_model=BranchResponse)
async def update_branch(branch_id: str, branch: BranchCreate, current_user: dict = Depends(get_current_user)):
    db = get_db()
    if not db:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    await db.branches.update_one({"id": branch_id}, {"$set": branch.model_dump()})
    updated = await db.branches.find_one({"id": branch_id}, {"_id": 0})
    return BranchResponse(**updated)

@router.delete("/{branch_id}")
async def delete_branch(branch_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    if not db:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    result = await db.branches.delete_one({"id": branch_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Şube bulunamadı")
    return {"status": "deleted"}

# Şube Raporları
@router.get("/{branch_id}/reports/summary")
async def get_branch_summary(branch_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    if not db:
        return {"totalSales": 0, "totalOrders": 0, "avgOrder": 0}
    
    # Basit özet
    orders = await db.pos_orders.find({"branch_id": branch_id}, {"_id": 0}).to_list(1000)
    total_sales = sum(o.get("total", 0) for o in orders)
    
    return {
        "totalSales": total_sales,
        "totalOrders": len(orders),
        "avgOrder": total_sales / len(orders) if orders else 0
    }
