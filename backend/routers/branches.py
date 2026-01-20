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
    code: Optional[str] = None  # Opsiyonel - otomatik oluşturulacak
    address: str
    phone: Optional[str] = None
    manager_name: Optional[str] = None
    manager_email: Optional[str] = None
    api_url: Optional[str] = None

class BranchResponse(BaseModel):
    id: str
    name: str
    code: str
    address: str
    phone: Optional[str] = None
    manager_name: Optional[str] = None
    manager_email: Optional[str] = None
    api_url: Optional[str] = None
    status: str = "active"
    created_at: Optional[str] = None

@router.post("", response_model=BranchResponse)
async def create_branch(branch: BranchCreate, current_user: dict = Depends(get_current_user)):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    # Şube kodu yoksa otomatik oluştur
    branch_code = branch.code
    if not branch_code:
        # İsimden kod oluştur (örn: "Ankara Kızılay" -> "ANK-001")
        name_parts = branch.name.upper().split()
        prefix = name_parts[0][:3] if name_parts else "SUB"
        
        # Mevcut şube sayısını al
        count = await db.branches.count_documents({})
        branch_code = f"{prefix}-{count+1:03d}"
    
    existing = await db.branches.find_one({"code": branch_code})
    if existing:
        raise HTTPException(status_code=400, detail="Bu şube kodu zaten mevcut")
    
    branch_doc = {
        "id": str(uuid.uuid4()),
        "name": branch.name,
        "code": branch_code,
        "address": branch.address,
        "phone": branch.phone,
        "manager_name": branch.manager_name,
        "manager_email": branch.manager_email,
        "api_url": branch.api_url,
        "status": "active",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.branches.insert_one(branch_doc)
    branch_doc.pop("_id", None)
    return BranchResponse(**branch_doc)

@router.get("", response_model=List[BranchResponse])
async def get_branches(current_user: dict = Depends(get_current_user)):
    db = get_db()
    if db is None:
        return []
    branches = await db.branches.find({}, {"_id": 0}).to_list(100)
    return [BranchResponse(**b) for b in branches]

@router.get("/{branch_id}", response_model=BranchResponse)
async def get_branch(branch_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=404, detail="Şube bulunamadı")
    branch = await db.branches.find_one({"id": branch_id}, {"_id": 0})
    if not branch:
        raise HTTPException(status_code=404, detail="Şube bulunamadı")
    return BranchResponse(**branch)

@router.put("/{branch_id}", response_model=BranchResponse)
async def update_branch(branch_id: str, branch: BranchCreate, current_user: dict = Depends(get_current_user)):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    await db.branches.update_one({"id": branch_id}, {"$set": branch.model_dump()})
    updated = await db.branches.find_one({"id": branch_id}, {"_id": 0})
    return BranchResponse(**updated)

@router.delete("/{branch_id}")
async def delete_branch(branch_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    result = await db.branches.delete_one({"id": branch_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Şube bulunamadı")
    return {"status": "deleted"}

# Şube Raporları
@router.get("/{branch_id}/reports/summary")
async def get_branch_summary(branch_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    if db is None:
        return {"today_orders": 0, "today_revenue": 0}
    
    from datetime import datetime, timezone, timedelta
    
    # Bugünün başlangıcı
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    today_str = today_start.isoformat()
    
    # Bu ayın başlangıcı
    month_start = today_start.replace(day=1)
    month_str = month_start.isoformat()
    
    # Tüm siparişleri topla (kiosk, pos, delivery)
    all_orders = []
    
    # Kiosk siparişleri
    kiosk_orders = await db.kiosk_orders.find({"branch_id": branch_id}, {"_id": 0}).to_list(500)
    all_orders.extend([{**o, "source": "kiosk"} for o in kiosk_orders])
    
    # POS siparişleri
    pos_orders = await db.pos_orders.find({"branch_id": branch_id}, {"_id": 0}).to_list(500)
    all_orders.extend([{**o, "source": "pos"} for o in pos_orders])
    
    # Delivery siparişleri
    delivery_orders = await db.delivery_orders.find({"branch_id": branch_id}, {"_id": 0}).to_list(500)
    all_orders.extend([{**o, "source": "delivery"} for o in delivery_orders])
    
    # Bugünkü siparişler
    today_orders = [o for o in all_orders if o.get("created_at", "") >= today_str]
    today_revenue = sum(o.get("total", 0) for o in today_orders)
    
    # Bu ayki siparişler
    month_orders = [o for o in all_orders if o.get("created_at", "") >= month_str]
    month_revenue = sum(o.get("total", 0) for o in month_orders)
    
    # Kaynak bazlı sayılar
    kiosk_count = len([o for o in all_orders if o.get("source") == "kiosk"])
    pos_count = len([o for o in all_orders if o.get("source") == "pos"])
    online_count = len([o for o in all_orders if o.get("source") == "delivery"])
    
    # Ortalama sipariş tutarı
    avg_order = month_revenue / len(month_orders) if month_orders else 0
    
    # Son 5 sipariş
    recent = sorted(all_orders, key=lambda x: x.get("created_at", ""), reverse=True)[:5]
    recent_orders = [{
        "order_number": o.get("order_number", o.get("queue_number", "---")),
        "source": o.get("source", "---"),
        "total": o.get("total", 0)
    } for o in recent]
    
    return {
        "today_orders": len(today_orders),
        "today_revenue": today_revenue,
        "month_orders": len(month_orders),
        "month_revenue": month_revenue,
        "kiosk_orders": kiosk_count,
        "pos_orders": pos_count,
        "online_orders": online_count,
        "avg_order_value": round(avg_order, 2),
        "total_customers": len(set(o.get("customer_phone", o.get("customer_id", "")) for o in all_orders if o.get("customer_phone") or o.get("customer_id"))),
        "active_products": 0,  # TODO: Şube bazlı ürün sayısı
        "recent_orders": recent_orders
    }
