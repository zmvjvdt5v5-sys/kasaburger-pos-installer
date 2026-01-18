"""Campaigns Router - Kampanya Yönetimi"""
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from pydantic import BaseModel

from utils.auth import get_current_user
from utils.database import get_db

router = APIRouter(prefix="/campaigns", tags=["Campaigns"])


class CampaignCreate(BaseModel):
    title: str
    description: Optional[str] = ""
    campaign_type: str = "discount"  # discount, new_product, announcement
    discount_type: Optional[str] = "percent"  # percent, fixed
    discount_value: Optional[float] = 0
    start_date: str
    end_date: str
    target_dealers: Optional[List[str]] = []
    send_sms: Optional[bool] = False
    send_email: Optional[bool] = False


@router.get("")
async def get_campaigns(current_user: dict = Depends(get_current_user)):
    """Tüm kampanyaları getir"""
    db = get_db()
    if db is None:
        return []
    
    campaigns = await db.campaigns.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return campaigns


@router.post("")
async def create_campaign(campaign: CampaignCreate, current_user: dict = Depends(get_current_user)):
    """Yeni kampanya oluştur"""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    campaign_id = str(uuid.uuid4())
    campaign_doc = {
        "id": campaign_id,
        **campaign.model_dump(),
        "status": "active",
        "sms_sent": False,
        "email_sent": False,
        "sms_count": 0,
        "email_count": 0,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "created_by": current_user.get("name", "Admin")
    }
    await db.campaigns.insert_one(campaign_doc)
    campaign_doc.pop("_id", None)
    
    return {"campaign": campaign_doc, "notifications": {"sms": None, "email": None}}


@router.get("/{campaign_id}")
async def get_campaign(campaign_id: str, current_user: dict = Depends(get_current_user)):
    """Belirli bir kampanyayı getir"""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=404, detail="Kampanya bulunamadı")
    
    campaign = await db.campaigns.find_one({"id": campaign_id}, {"_id": 0})
    if not campaign:
        raise HTTPException(status_code=404, detail="Kampanya bulunamadı")
    return campaign


@router.put("/{campaign_id}")
async def update_campaign(campaign_id: str, campaign: CampaignCreate, current_user: dict = Depends(get_current_user)):
    """Kampanya güncelle"""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    result = await db.campaigns.update_one(
        {"id": campaign_id},
        {"$set": campaign.model_dump()}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Kampanya bulunamadı")
    
    updated = await db.campaigns.find_one({"id": campaign_id}, {"_id": 0})
    return updated


@router.delete("/{campaign_id}")
async def delete_campaign(campaign_id: str, current_user: dict = Depends(get_current_user)):
    """Kampanya sil"""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    result = await db.campaigns.delete_one({"id": campaign_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Kampanya bulunamadı")
    return {"message": "Kampanya silindi"}


@router.post("/{campaign_id}/send")
async def send_campaign_notifications(
    campaign_id: str,
    send_sms: bool = True,
    send_email: bool = True,
    current_user: dict = Depends(get_current_user)
):
    """Kampanya bildirimlerini gönder"""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    campaign = await db.campaigns.find_one({"id": campaign_id}, {"_id": 0})
    if not campaign:
        raise HTTPException(status_code=404, detail="Kampanya bulunamadı")
    
    # Hedef bayileri al
    target_dealers = campaign.get("target_dealers", [])
    if target_dealers and len(target_dealers) > 0:
        dealers = await db.dealers.find({"id": {"$in": target_dealers}}, {"_id": 0}).to_list(100)
    else:
        dealers = await db.dealers.find({}, {"_id": 0}).to_list(100)
    
    results = {"sms": None, "email": None}
    
    # SMS ve Email gönderimi burada yapılacak (entegrasyon gerekli)
    if send_sms:
        results["sms"] = {"sent": len(dealers), "failed": 0, "message": "SMS gönderim simülasyonu"}
        await db.campaigns.update_one(
            {"id": campaign_id},
            {"$set": {"sms_sent": True, "sms_count": len(dealers)}}
        )
    
    if send_email:
        results["email"] = {"sent": len(dealers), "failed": 0, "message": "Email gönderim simülasyonu"}
        await db.campaigns.update_one(
            {"id": campaign_id},
            {"$set": {"email_sent": True, "email_count": len(dealers)}}
        )
    
    return {"message": "Bildirimler gönderildi", "results": results}
