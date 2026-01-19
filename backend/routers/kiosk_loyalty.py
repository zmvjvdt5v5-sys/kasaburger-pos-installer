"""Kiosk Sadakat Programı Router - Loyalty, Referral, Birthday"""
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends, Body
from typing import List, Optional
from pydantic import BaseModel

from utils.auth import get_current_user
from utils.database import get_db

router = APIRouter(prefix="/kiosk", tags=["Kiosk Loyalty"])


# ==================== PYDANTIC MODELS ====================

class LoyaltyMember(BaseModel):
    id: Optional[str] = None
    phone: str
    name: Optional[str] = None
    total_points: int = 0
    total_orders: int = 0
    total_spent: float = 0
    tier: str = "bronze"
    qr_code: Optional[str] = None
    created_at: Optional[str] = None
    last_order_at: Optional[str] = None
    birth_date: Optional[str] = None
    last_birthday_bonus_year: Optional[int] = None


class LoyaltyReward(BaseModel):
    id: Optional[str] = None
    name: str
    description: Optional[str] = None
    points_required: int
    reward_type: str = "free_product"
    reward_value: Optional[str] = None
    is_active: bool = True
    image: Optional[str] = None


class LoyaltyTransaction(BaseModel):
    member_id: str
    order_id: Optional[str] = None
    points: int
    transaction_type: str
    description: str


# ==================== CONFIG ====================

LOYALTY_CONFIG = {
    "points_per_lira": 1,
    "tiers": {
        "bronze": {"min_points": 0, "bonus_multiplier": 1.0, "name": "Bronz", "icon": "🥉"},
        "silver": {"min_points": 500, "bonus_multiplier": 1.25, "name": "Gümüş", "icon": "🥈"},
        "gold": {"min_points": 1500, "bonus_multiplier": 1.5, "name": "Altın", "icon": "🥇"},
        "platinum": {"min_points": 5000, "bonus_multiplier": 2.0, "name": "Platin", "icon": "💎"}
    },
    "birthday_bonus": {
        "points": 200,
        "free_product_id": "kasa-classic",
        "free_product_name": "Kasa Classic Burger",
        "message": "🎂 Doğum Günün Kutlu Olsun! Sana özel hediyeler var!"
    }
}

DEFAULT_REWARDS = [
    {"id": "free-drink", "name": "Ücretsiz İçecek", "description": "Ayran, Su veya Pepsi", "points_required": 100, "reward_type": "free_product", "reward_value": "pepsi", "is_active": True, "image": "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768720380/kasaburger/products/zu98squbgxxa0hppmxwn.jpg"},
    {"id": "free-fries", "name": "Ücretsiz Patates", "description": "Cheese Fries veya Cajun Fries", "points_required": 200, "reward_type": "free_product", "reward_value": "cheese-fries", "is_active": True, "image": "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768720240/kasaburger/products/dzxb0lv41xafeybynhri.jpg"},
    {"id": "free-dessert", "name": "Ücretsiz Tatlı", "description": "Churros veya Oreo Dream", "points_required": 300, "reward_type": "free_product", "reward_value": "churros", "is_active": True, "image": "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768686916/kasaburger/products/yveoyknzrq0w0kuwxxvq.jpg"},
    {"id": "free-burger", "name": "Ücretsiz Burger", "description": "Kasa Classic Burger", "points_required": 500, "reward_type": "free_product", "reward_value": "kasa-classic", "is_active": True, "image": "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768719627/kasaburger/products/lxmwj2opjfgpn5wfyvni.jpg"},
    {"id": "discount-10", "name": "%10 İndirim", "description": "Sonraki siparişte %10 indirim", "points_required": 150, "reward_type": "discount_percent", "reward_value": "10", "is_active": True},
    {"id": "discount-50tl", "name": "50₺ İndirim", "description": "Sonraki siparişte 50₺ indirim", "points_required": 400, "reward_type": "discount_fixed", "reward_value": "50", "is_active": True}
]

REFERRAL_BONUS = 100


# ==================== HELPER FUNCTIONS ====================

def calculate_tier(total_points: int) -> str:
    if total_points >= LOYALTY_CONFIG["tiers"]["platinum"]["min_points"]:
        return "platinum"
    elif total_points >= LOYALTY_CONFIG["tiers"]["gold"]["min_points"]:
        return "gold"
    elif total_points >= LOYALTY_CONFIG["tiers"]["silver"]["min_points"]:
        return "silver"
    return "bronze"


def _get_next_tier(current_tier: str, current_points: int):
    tiers = list(LOYALTY_CONFIG["tiers"].items())
    current_idx = next((i for i, (k, v) in enumerate(tiers) if k == current_tier), 0)
    if current_idx < len(tiers) - 1:
        next_tier_key, next_tier = tiers[current_idx + 1]
        return {"name": next_tier["name"], "icon": next_tier["icon"], "points_needed": next_tier["min_points"] - current_points}
    return None


# ==================== CONFIG ENDPOINTS ====================

@router.get("/loyalty/config")
async def get_loyalty_config():
    return {"points_per_lira": LOYALTY_CONFIG["points_per_lira"], "tiers": LOYALTY_CONFIG["tiers"]}


# ==================== REWARDS ENDPOINTS ====================

@router.get("/loyalty/rewards")
async def get_loyalty_rewards():
    db = get_db()
    if db is None:
        return DEFAULT_REWARDS
    rewards = await db.loyalty_rewards.find({"is_active": True}, {"_id": 0}).to_list(50)
    if not rewards:
        for reward in DEFAULT_REWARDS:
            existing = await db.loyalty_rewards.find_one({"id": reward["id"]})
            if not existing:
                await db.loyalty_rewards.insert_one({**reward})
        rewards = await db.loyalty_rewards.find({"is_active": True}, {"_id": 0}).to_list(50)
    return rewards


@router.get("/loyalty/rewards/all")
async def get_all_loyalty_rewards(current_user: dict = Depends(get_current_user)):
    db = get_db()
    if db is None:
        return DEFAULT_REWARDS
    rewards = await db.loyalty_rewards.find({}, {"_id": 0}).to_list(100)
    return rewards if rewards else DEFAULT_REWARDS


@router.post("/loyalty/rewards")
async def create_loyalty_reward(reward: LoyaltyReward, current_user: dict = Depends(get_current_user)):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    reward_doc = {"id": str(uuid.uuid4())[:8], **reward.model_dump(exclude={"id"}), "created_at": datetime.now(timezone.utc).isoformat()}
    await db.loyalty_rewards.insert_one(reward_doc)
    reward_doc.pop("_id", None)
    return reward_doc


@router.put("/loyalty/rewards/{reward_id}")
async def update_loyalty_reward(reward_id: str, reward: LoyaltyReward, current_user: dict = Depends(get_current_user)):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    await db.loyalty_rewards.update_one({"id": reward_id}, {"$set": reward.model_dump(exclude={"id"})})
    return {"status": "success"}


@router.delete("/loyalty/rewards/{reward_id}")
async def delete_loyalty_reward(reward_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    await db.loyalty_rewards.delete_one({"id": reward_id})
    return {"status": "deleted"}


# ==================== MEMBER ENDPOINTS ====================

@router.post("/loyalty/member/lookup")
async def lookup_loyalty_member(phone: str = Body(..., embed=True)):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    clean_phone = "".join(filter(str.isdigit, phone))
    if len(clean_phone) < 10:
        raise HTTPException(status_code=400, detail="Geçersiz telefon numarası")
    
    member = await db.loyalty_members.find_one({"phone": clean_phone}, {"_id": 0})
    
    if member:
        tier = calculate_tier(member.get("total_points", 0))
        if tier != member.get("tier"):
            await db.loyalty_members.update_one({"phone": clean_phone}, {"$set": {"tier": tier}})
            member["tier"] = tier
        tier_info = LOYALTY_CONFIG["tiers"].get(tier, LOYALTY_CONFIG["tiers"]["bronze"])
        return {"is_new": False, "member": member, "tier_info": tier_info, "next_tier": _get_next_tier(tier, member.get("total_points", 0))}
    
    new_member = {
        "id": str(uuid.uuid4())[:8], "phone": clean_phone, "name": None, "total_points": 0,
        "total_orders": 0, "total_spent": 0, "tier": "bronze", "qr_code": f"KASA-{clean_phone[-4:]}",
        "created_at": datetime.now(timezone.utc).isoformat(), "last_order_at": None
    }
    await db.loyalty_members.insert_one(new_member)
    new_member.pop("_id", None)
    return {"is_new": True, "member": new_member, "tier_info": LOYALTY_CONFIG["tiers"]["bronze"], "next_tier": _get_next_tier("bronze", 0), "welcome_bonus": 50}


@router.post("/loyalty/member/update-name")
async def update_member_name(phone: str = Body(...), name: str = Body(...)):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    clean_phone = "".join(filter(str.isdigit, phone))
    await db.loyalty_members.update_one({"phone": clean_phone}, {"$set": {"name": name}})
    return {"status": "success"}


@router.post("/loyalty/earn")
async def earn_loyalty_points(phone: str = Body(...), order_total: float = Body(...), order_id: str = Body(None)):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    clean_phone = "".join(filter(str.isdigit, phone))
    member = await db.loyalty_members.find_one({"phone": clean_phone}, {"_id": 0})
    if not member:
        raise HTTPException(status_code=404, detail="Üye bulunamadı")
    
    tier = member.get("tier", "bronze")
    tier_info = LOYALTY_CONFIG["tiers"].get(tier, LOYALTY_CONFIG["tiers"]["bronze"])
    multiplier = tier_info.get("bonus_multiplier", 1.0)
    
    base_points = int(order_total * LOYALTY_CONFIG["points_per_lira"])
    bonus_points = int(base_points * (multiplier - 1))
    total_earned = base_points + bonus_points
    
    new_total_points = member.get("total_points", 0) + total_earned
    new_tier = calculate_tier(new_total_points)
    
    await db.loyalty_members.update_one(
        {"phone": clean_phone},
        {"$set": {"tier": new_tier, "last_order_at": datetime.now(timezone.utc).isoformat()},
         "$inc": {"total_points": total_earned, "total_orders": 1, "total_spent": order_total}}
    )
    
    await db.loyalty_transactions.insert_one({
        "member_id": member["id"], "order_id": order_id, "points": total_earned, "transaction_type": "earn",
        "description": f"₺{order_total:.0f} sipariş - {base_points} + {bonus_points} bonus puan",
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {"base_points": base_points, "bonus_points": bonus_points, "total_earned": total_earned,
            "new_total": new_total_points, "tier": new_tier, "tier_upgraded": new_tier != tier,
            "tier_info": LOYALTY_CONFIG["tiers"].get(new_tier)}


@router.post("/loyalty/redeem")
async def redeem_loyalty_reward(phone: str = Body(...), reward_id: str = Body(...)):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    clean_phone = "".join(filter(str.isdigit, phone))
    member = await db.loyalty_members.find_one({"phone": clean_phone}, {"_id": 0})
    if not member:
        raise HTTPException(status_code=404, detail="Üye bulunamadı")
    
    reward = await db.loyalty_rewards.find_one({"id": reward_id, "is_active": True}, {"_id": 0})
    if not reward:
        reward = next((r for r in DEFAULT_REWARDS if r["id"] == reward_id and r["is_active"]), None)
    if not reward:
        raise HTTPException(status_code=404, detail="Ödül bulunamadı")
    
    if member.get("total_points", 0) < reward["points_required"]:
        raise HTTPException(status_code=400, detail="Yetersiz puan")
    
    new_total = member.get("total_points", 0) - reward["points_required"]
    await db.loyalty_members.update_one({"phone": clean_phone}, {"$set": {"total_points": new_total}})
    
    await db.loyalty_transactions.insert_one({
        "member_id": member["id"], "reward_id": reward_id, "points": -reward["points_required"],
        "transaction_type": "redeem", "description": f"Ödül: {reward['name']}",
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {"status": "success", "reward": reward, "points_used": reward["points_required"], "new_total": new_total}


@router.get("/loyalty/member/{phone}/history")
async def get_member_history(phone: str):
    db = get_db()
    if db is None:
        return []
    clean_phone = "".join(filter(str.isdigit, phone))
    member = await db.loyalty_members.find_one({"phone": clean_phone}, {"_id": 0})
    if not member:
        raise HTTPException(status_code=404, detail="Üye bulunamadı")
    return await db.loyalty_transactions.find({"member_id": member["id"]}, {"_id": 0}).sort("created_at", -1).to_list(50)


@router.get("/loyalty/members")
async def get_all_loyalty_members(current_user: dict = Depends(get_current_user)):
    db = get_db()
    if db is None:
        return []
    return await db.loyalty_members.find({}, {"_id": 0}).sort("total_points", -1).to_list(500)


@router.get("/loyalty/stats")
async def get_loyalty_stats(current_user: dict = Depends(get_current_user)):
    db = get_db()
    if db is None:
        return {"total_members": 0, "total_points_earned": 0}
    
    total_members = await db.loyalty_members.count_documents({})
    bronze = await db.loyalty_members.count_documents({"tier": "bronze"})
    silver = await db.loyalty_members.count_documents({"tier": "silver"})
    gold = await db.loyalty_members.count_documents({"tier": "gold"})
    platinum = await db.loyalty_members.count_documents({"tier": "platinum"})
    
    pipeline = [{"$group": {"_id": None, "total": {"$sum": "$total_spent"}}}]
    result = await db.loyalty_members.aggregate(pipeline).to_list(1)
    total_spent = result[0]["total"] if result else 0
    
    return {"total_members": total_members, "total_spent": total_spent,
            "tier_distribution": {"bronze": bronze, "silver": silver, "gold": gold, "platinum": platinum}}


# ==================== REFERRAL ENDPOINTS ====================

@router.get("/loyalty/member/{phone}/referral-code")
async def get_referral_code(phone: str):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    clean_phone = "".join(filter(str.isdigit, phone))
    member = await db.loyalty_members.find_one({"phone": clean_phone}, {"_id": 0})
    if not member:
        raise HTTPException(status_code=404, detail="Üye bulunamadı")
    
    if not member.get("referral_code"):
        referral_code = f"KB{clean_phone[-4:]}{str(uuid.uuid4())[:4].upper()}"
        await db.loyalty_members.update_one({"phone": clean_phone}, {"$set": {"referral_code": referral_code}})
        member["referral_code"] = referral_code
    
    referral_count = await db.loyalty_members.count_documents({"referred_by": member.get("referral_code")})
    return {"referral_code": member.get("referral_code"), "referral_count": referral_count, "bonus_per_referral": REFERRAL_BONUS}


@router.post("/loyalty/member/apply-referral")
async def apply_referral_code(phone: str = Body(...), referral_code: str = Body(...)):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    clean_phone = "".join(filter(str.isdigit, phone))
    new_member = await db.loyalty_members.find_one({"phone": clean_phone}, {"_id": 0})
    if not new_member:
        raise HTTPException(status_code=404, detail="Üye bulunamadı")
    if new_member.get("referred_by"):
        raise HTTPException(status_code=400, detail="Bu hesap zaten bir referans kodu kullanmış")
    
    referrer = await db.loyalty_members.find_one({"referral_code": referral_code.upper()}, {"_id": 0})
    if not referrer:
        raise HTTPException(status_code=404, detail="Geçersiz referans kodu")
    if referrer["phone"] == clean_phone:
        raise HTTPException(status_code=400, detail="Kendi referans kodunuzu kullanamazsınız")
    
    await db.loyalty_members.update_one({"phone": clean_phone}, {"$set": {"referred_by": referral_code.upper()}, "$inc": {"total_points": REFERRAL_BONUS}})
    await db.loyalty_members.update_one({"referral_code": referral_code.upper()}, {"$inc": {"total_points": REFERRAL_BONUS, "referral_earned": REFERRAL_BONUS}})
    
    await db.loyalty_transactions.insert_one({"member_id": new_member["id"], "points": REFERRAL_BONUS, "transaction_type": "referral_bonus", "description": f"Referans bonusu ({referral_code.upper()})", "created_at": datetime.now(timezone.utc).isoformat()})
    await db.loyalty_transactions.insert_one({"member_id": referrer["id"], "points": REFERRAL_BONUS, "transaction_type": "referral_earn", "description": f"Arkadaş daveti bonusu ({clean_phone[-4:]})", "created_at": datetime.now(timezone.utc).isoformat()})
    
    return {"status": "success", "bonus_earned": REFERRAL_BONUS, "message": f"Tebrikler! {REFERRAL_BONUS} puan kazandınız!"}


@router.get("/loyalty/referral-stats")
async def get_referral_stats(current_user: dict = Depends(get_current_user)):
    db = get_db()
    if db is None:
        return {"total_referrals": 0, "total_bonus_given": 0}
    
    total_referrals = await db.loyalty_members.count_documents({"referred_by": {"$exists": True, "$ne": None}})
    
    pipeline = [
        {"$match": {"referral_code": {"$exists": True}}},
        {"$lookup": {"from": "loyalty_members", "localField": "referral_code", "foreignField": "referred_by", "as": "referrals"}},
        {"$project": {"_id": 0, "phone": 1, "name": 1, "referral_code": 1, "referral_count": {"$size": "$referrals"}}},
        {"$match": {"referral_count": {"$gt": 0}}},
        {"$sort": {"referral_count": -1}},
        {"$limit": 10}
    ]
    top_referrers = await db.loyalty_members.aggregate(pipeline).to_list(10)
    
    return {"total_referrals": total_referrals, "total_bonus_given": total_referrals * REFERRAL_BONUS * 2, "bonus_per_referral": REFERRAL_BONUS, "top_referrers": top_referrers}


# ==================== BIRTHDAY ENDPOINTS ====================

@router.post("/loyalty/member/set-birthday")
async def set_member_birthday(phone: str = Body(...), birth_date: str = Body(...)):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    clean_phone = "".join(filter(str.isdigit, phone))
    try:
        month, day = birth_date.split("-")
        month, day = int(month), int(day)
        if not (1 <= month <= 12 and 1 <= day <= 31):
            raise ValueError()
        birth_date_formatted = f"{month:02d}-{day:02d}"
    except:
        raise HTTPException(status_code=400, detail="Geçersiz tarih formatı. Format: MM-DD (örn: 05-15)")
    
    result = await db.loyalty_members.update_one({"phone": clean_phone}, {"$set": {"birth_date": birth_date_formatted}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Üye bulunamadı")
    return {"status": "success", "birth_date": birth_date_formatted, "message": "Doğum günü kaydedildi! 🎂"}


@router.get("/loyalty/member/{phone}/birthday-status")
async def check_birthday_bonus(phone: str):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    clean_phone = "".join(filter(str.isdigit, phone))
    member = await db.loyalty_members.find_one({"phone": clean_phone}, {"_id": 0})
    if not member:
        raise HTTPException(status_code=404, detail="Üye bulunamadı")
    
    birth_date = member.get("birth_date")
    if not birth_date:
        return {"has_birthday": False, "is_birthday_today": False, "can_claim_bonus": False, "message": "Doğum günü bilgisi kayıtlı değil"}
    
    today = datetime.now(timezone.utc)
    today_mmdd = f"{today.month:02d}-{today.day:02d}"
    is_birthday = (birth_date == today_mmdd)
    last_bonus_year = member.get("last_birthday_bonus_year")
    can_claim = is_birthday and (last_bonus_year != today.year)
    
    birthday_config = LOYALTY_CONFIG.get("birthday_bonus", {})
    return {
        "has_birthday": True, "birth_date": birth_date, "is_birthday_today": is_birthday,
        "can_claim_bonus": can_claim, "already_claimed_this_year": (last_bonus_year == today.year),
        "bonus_points": birthday_config.get("points", 200), "free_product": birthday_config.get("free_product_name", "Kasa Classic Burger"),
        "message": birthday_config.get("message") if is_birthday else None
    }


@router.post("/loyalty/member/claim-birthday-bonus")
async def claim_birthday_bonus(phone: str = Body(..., embed=True)):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    clean_phone = "".join(filter(str.isdigit, phone))
    member = await db.loyalty_members.find_one({"phone": clean_phone}, {"_id": 0})
    if not member:
        raise HTTPException(status_code=404, detail="Üye bulunamadı")
    
    birth_date = member.get("birth_date")
    if not birth_date:
        raise HTTPException(status_code=400, detail="Doğum günü bilgisi kayıtlı değil")
    
    today = datetime.now(timezone.utc)
    today_mmdd = f"{today.month:02d}-{today.day:02d}"
    if birth_date != today_mmdd:
        raise HTTPException(status_code=400, detail="Bugün doğum gününüz değil")
    
    last_bonus_year = member.get("last_birthday_bonus_year")
    if last_bonus_year == today.year:
        raise HTTPException(status_code=400, detail="Bu yılki doğum günü bonusunuzu zaten aldınız")
    
    birthday_config = LOYALTY_CONFIG.get("birthday_bonus", {})
    bonus_points = birthday_config.get("points", 200)
    
    await db.loyalty_members.update_one({"phone": clean_phone}, {"$inc": {"total_points": bonus_points}, "$set": {"last_birthday_bonus_year": today.year}})
    await db.loyalty_transactions.insert_one({"member_id": member["id"], "points": bonus_points, "transaction_type": "birthday_bonus", "description": f"🎂 Doğum günü bonusu {today.year}", "created_at": datetime.now(timezone.utc).isoformat()})
    
    new_total = member.get("total_points", 0) + bonus_points
    return {
        "status": "success", "bonus_points": bonus_points, "free_product_id": birthday_config.get("free_product_id"),
        "free_product_name": birthday_config.get("free_product_name"), "new_total_points": new_total,
        "message": "🎂 Doğum Günün Kutlu Olsun! 200 puan + Ücretsiz Kasa Classic Burger kazandın!"
    }


@router.get("/loyalty/birthdays/today")
async def get_todays_birthdays(current_user: dict = Depends(get_current_user)):
    db = get_db()
    if db is None:
        return []
    
    today = datetime.now(timezone.utc)
    today_mmdd = f"{today.month:02d}-{today.day:02d}"
    members = await db.loyalty_members.find({"birth_date": today_mmdd}, {"_id": 0, "phone": 1, "name": 1, "total_points": 1, "tier": 1, "last_birthday_bonus_year": 1}).to_list(100)
    
    for member in members:
        member["bonus_claimed"] = (member.get("last_birthday_bonus_year") == today.year)
    
    return {"date": today_mmdd, "count": len(members), "members": members}
