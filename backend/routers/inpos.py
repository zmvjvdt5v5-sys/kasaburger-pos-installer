"""InPOS Router - Yazar Kasa Entegrasyonu"""
import uuid
import socket
import json
import logging
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends
from typing import Optional, Dict, List

from models.pos import InPOSConfig, InPOSPaymentRequest, InPOSFiscalRequest
from utils.auth import get_current_user
from utils.database import get_db

router = APIRouter(prefix="/inpos", tags=["InPOS"])

@router.get("/config")
async def get_inpos_config(current_user: dict = Depends(get_current_user)):
    db = get_db()
    if db is None:
        return {
            "enabled": False,
            "ip_address": "192.168.1.100",
            "port": 59000,
            "timeout": 30,
            "auto_print": True,
            "payment_mappings": {
                "cash": 1, "card": 2, "online": 7,
                "sodexo": 3, "multinet": 4, "ticket": 5, "setcard": 6
            }
        }
    
    config = await db.settings.find_one({"type": "inpos"}, {"_id": 0})
    if not config:
        return {
            "enabled": False,
            "ip_address": "192.168.1.100",
            "port": 59000,
            "timeout": 30,
            "auto_print": True,
            "payment_mappings": {
                "cash": 1, "card": 2, "online": 7,
                "sodexo": 3, "multinet": 4, "ticket": 5, "setcard": 6
            }
        }
    return config

@router.post("/config")
async def save_inpos_config(config: InPOSConfig, current_user: dict = Depends(get_current_user)):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    config_doc = {
        "type": "inpos",
        **config.model_dump(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "updated_by": current_user.get("user_id")
    }
    await db.settings.update_one(
        {"type": "inpos"},
        {"$set": config_doc},
        upsert=True
    )
    return {"success": True, "message": "InPOS ayarları kaydedildi"}

@router.post("/test")
async def test_inpos_connection(current_user: dict = Depends(get_current_user)):
    db = get_db()
    config = await db.settings.find_one({"type": "inpos"}, {"_id": 0}) if db else None
    
    if not config:
        return {"success": False, "error": "InPOS yapılandırması bulunamadı"}
    
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(5)
        result = sock.connect_ex((config.get("ip_address", "192.168.1.100"), config.get("port", 59000)))
        sock.close()
        
        if result == 0:
            return {"success": True, "message": f"InPOS bağlantısı başarılı ({config.get('ip_address')}:{config.get('port')})"}
        else:
            return {"success": False, "error": f"Bağlantı başarısız. Kod: {result}"}
    except socket.timeout:
        return {"success": False, "error": "Bağlantı zaman aşımı"}
    except Exception as e:
        return {"success": False, "error": f"Bağlantı hatası: {str(e)}"}

@router.post("/payment")
async def process_inpos_payment(request: InPOSPaymentRequest, current_user: dict = Depends(get_current_user)):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    config = await db.settings.find_one({"type": "inpos"}, {"_id": 0})
    if not config or not config.get("enabled"):
        return {"success": False, "error": "InPOS entegrasyonu aktif değil"}
    
    order = await db.pos_orders.find_one({"id": request.order_id}, {"_id": 0})
    if not order:
        return {"success": False, "error": "Sipariş bulunamadı"}
    
    payment_type = config.get("payment_mappings", {}).get(request.payment_method, 2)
    
    inpos_command = {
        "command": "PAYMENT",
        "transaction_id": str(uuid.uuid4())[:8].upper(),
        "amount": int(request.amount * 100),
        "payment_type": payment_type,
        "tip_amount": int(request.tip_amount * 100) if request.tip_amount else 0,
        "installments": request.installments or 1,
        "order_id": request.order_id
    }
    
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(config.get("timeout", 30))
        sock.connect((config.get("ip_address"), config.get("port")))
        
        message = json.dumps(inpos_command).encode('utf-8')
        sock.sendall(message + b'\n')
        
        response = sock.recv(4096).decode('utf-8')
        sock.close()
        
        response_data = json.loads(response)
        
        if response_data.get("status") == "SUCCESS" or response_data.get("result_code") == "00":
            payment_record = {
                "id": str(uuid.uuid4()),
                "order_id": request.order_id,
                "amount": request.amount,
                "method": request.payment_method,
                "tip_amount": request.tip_amount or 0,
                "inpos_transaction_id": inpos_command["transaction_id"],
                "inpos_response": response_data,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.pos_payments.insert_one(payment_record)
            
            await db.pos_orders.update_one(
                {"id": request.order_id},
                {"$set": {"status": "paid", "payment_method": request.payment_method}}
            )
            
            return {
                "success": True,
                "message": "Ödeme başarılı",
                "transaction_id": inpos_command["transaction_id"],
                "approval_code": response_data.get("approval_code")
            }
        else:
            return {"success": False, "error": response_data.get("error_message", "Ödeme reddedildi")}
            
    except socket.timeout:
        return {"success": False, "error": "İşlem zaman aşımı"}
    except ConnectionRefusedError:
        return {"success": False, "error": "Bağlantı reddedildi"}
    except Exception as e:
        logging.error(f"InPOS payment error: {e}")
        return {"success": False, "error": f"Ödeme hatası: {str(e)}"}

@router.get("/status")
async def get_inpos_status(current_user: dict = Depends(get_current_user)):
    db = get_db()
    config = await db.settings.find_one({"type": "inpos"}, {"_id": 0}) if db else None
    
    if not config:
        return {"connected": False, "enabled": False, "config": None}
    
    if not config.get("enabled"):
        return {"connected": False, "enabled": False, "config": config}
    
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(3)
        result = sock.connect_ex((config.get("ip_address"), config.get("port")))
        sock.close()
        connected = result == 0
    except:
        connected = False
    
    last_transaction = None
    if db is not None:
        last_transaction = await db.pos_payments.find_one(
            {"inpos_transaction_id": {"$exists": True}},
            {"_id": 0, "created_at": 1, "amount": 1, "method": 1},
            sort=[("created_at", -1)]
        )
    
    return {
        "connected": connected,
        "enabled": config.get("enabled", False),
        "ip_address": config.get("ip_address"),
        "port": config.get("port"),
        "last_transaction": last_transaction
    }

@router.get("/z-report")
async def get_inpos_z_report(current_user: dict = Depends(get_current_user)):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    config = await db.settings.find_one({"type": "inpos"}, {"_id": 0})
    if not config or not config.get("enabled"):
        return {"success": False, "error": "InPOS entegrasyonu aktif değil"}
    
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(60)
        sock.connect((config.get("ip_address"), config.get("port")))
        
        message = json.dumps({"command": "Z_REPORT"}).encode('utf-8')
        sock.sendall(message + b'\n')
        
        response = sock.recv(8192).decode('utf-8')
        sock.close()
        
        response_data = json.loads(response)
        
        if response_data.get("status") == "SUCCESS":
            z_report = {
                "id": str(uuid.uuid4()),
                "z_no": response_data.get("z_no"),
                "date": datetime.now(timezone.utc).isoformat(),
                "total_sales": response_data.get("total_sales", 0),
                "raw_data": response_data,
                "created_by": current_user.get("user_id")
            }
            await db.z_reports.insert_one(z_report)
            
            return {"success": True, "message": "Z Raporu alındı", "report": z_report}
        else:
            return {"success": False, "error": response_data.get("error_message", "Z raporu alınamadı")}
            
    except Exception as e:
        logging.error(f"InPOS Z report error: {e}")
        return {"success": False, "error": f"Z raporu hatası: {str(e)}"}
