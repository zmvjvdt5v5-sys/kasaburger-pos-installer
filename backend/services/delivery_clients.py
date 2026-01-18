"""Delivery Platform API Clients"""
import aiohttp
import hashlib
import hmac
import json
import logging
from datetime import datetime, timezone
from typing import Optional, Dict, List

logger = logging.getLogger(__name__)

class YemeksepetiClient:
    """Yemeksepeti API Client"""
    
    BASE_URL = "https://api.yemeksepeti.com/v1"
    
    def __init__(self, api_key: str, api_secret: str, restaurant_id: str):
        self.api_key = api_key
        self.api_secret = api_secret
        self.restaurant_id = restaurant_id
    
    def _sign_request(self, method: str, path: str, body: str = "") -> str:
        """HMAC signature oluştur"""
        timestamp = datetime.now(timezone.utc).isoformat()
        message = f"{method}\n{path}\n{timestamp}\n{body}"
        signature = hmac.new(
            self.api_secret.encode(),
            message.encode(),
            hashlib.sha256
        ).hexdigest()
        return signature
    
    async def get_orders(self, status: Optional[str] = None) -> List[Dict]:
        """Aktif siparişleri getir"""
        async with aiohttp.ClientSession() as session:
            headers = {
                "X-Api-Key": self.api_key,
                "X-Restaurant-Id": self.restaurant_id,
                "Content-Type": "application/json"
            }
            params = {}
            if status:
                params["status"] = status
            
            try:
                async with session.get(
                    f"{self.BASE_URL}/orders",
                    headers=headers,
                    params=params
                ) as response:
                    if response.status == 200:
                        return await response.json()
                    else:
                        logger.error(f"Yemeksepeti API error: {response.status}")
                        return []
            except Exception as e:
                logger.error(f"Yemeksepeti connection error: {e}")
                return []
    
    async def accept_order(self, order_id: str, prep_time: int = 30) -> bool:
        """Siparişi kabul et"""
        async with aiohttp.ClientSession() as session:
            headers = {
                "X-Api-Key": self.api_key,
                "X-Restaurant-Id": self.restaurant_id,
                "Content-Type": "application/json"
            }
            body = {"preparationTime": prep_time}
            
            try:
                async with session.post(
                    f"{self.BASE_URL}/orders/{order_id}/accept",
                    headers=headers,
                    json=body
                ) as response:
                    return response.status == 200
            except Exception as e:
                logger.error(f"Yemeksepeti accept error: {e}")
                return False
    
    async def reject_order(self, order_id: str, reason: str) -> bool:
        """Siparişi reddet"""
        async with aiohttp.ClientSession() as session:
            headers = {
                "X-Api-Key": self.api_key,
                "X-Restaurant-Id": self.restaurant_id,
                "Content-Type": "application/json"
            }
            body = {"reason": reason}
            
            try:
                async with session.post(
                    f"{self.BASE_URL}/orders/{order_id}/reject",
                    headers=headers,
                    json=body
                ) as response:
                    return response.status == 200
            except Exception as e:
                logger.error(f"Yemeksepeti reject error: {e}")
                return False
    
    async def update_status(self, order_id: str, status: str) -> bool:
        """Sipariş durumu güncelle"""
        async with aiohttp.ClientSession() as session:
            headers = {
                "X-Api-Key": self.api_key,
                "X-Restaurant-Id": self.restaurant_id,
                "Content-Type": "application/json"
            }
            body = {"status": status}
            
            try:
                async with session.put(
                    f"{self.BASE_URL}/orders/{order_id}/status",
                    headers=headers,
                    json=body
                ) as response:
                    return response.status == 200
            except Exception as e:
                logger.error(f"Yemeksepeti status error: {e}")
                return False


class GetirClient:
    """Getir Yemek API Client"""
    
    BASE_URL = "https://api.getir.com/restaurant/v1"
    
    def __init__(self, api_key: str, restaurant_id: str):
        self.api_key = api_key
        self.restaurant_id = restaurant_id
    
    async def get_orders(self, status: Optional[str] = None) -> List[Dict]:
        """Aktif siparişleri getir"""
        async with aiohttp.ClientSession() as session:
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            
            try:
                async with session.get(
                    f"{self.BASE_URL}/restaurants/{self.restaurant_id}/orders",
                    headers=headers
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        return data.get("orders", [])
                    return []
            except Exception as e:
                logger.error(f"Getir connection error: {e}")
                return []
    
    async def accept_order(self, order_id: str) -> bool:
        """Siparişi kabul et"""
        async with aiohttp.ClientSession() as session:
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            
            try:
                async with session.post(
                    f"{self.BASE_URL}/orders/{order_id}/accept",
                    headers=headers
                ) as response:
                    return response.status == 200
            except Exception as e:
                logger.error(f"Getir accept error: {e}")
                return False
    
    async def reject_order(self, order_id: str, reason_code: str = "OUT_OF_STOCK") -> bool:
        """Siparişi reddet"""
        async with aiohttp.ClientSession() as session:
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            body = {"reasonCode": reason_code}
            
            try:
                async with session.post(
                    f"{self.BASE_URL}/orders/{order_id}/reject",
                    headers=headers,
                    json=body
                ) as response:
                    return response.status == 200
            except Exception as e:
                logger.error(f"Getir reject error: {e}")
                return False
    
    async def mark_preparing(self, order_id: str) -> bool:
        """Hazırlanıyor olarak işaretle"""
        async with aiohttp.ClientSession() as session:
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            
            try:
                async with session.post(
                    f"{self.BASE_URL}/orders/{order_id}/preparing",
                    headers=headers
                ) as response:
                    return response.status == 200
            except Exception as e:
                logger.error(f"Getir preparing error: {e}")
                return False
    
    async def mark_ready(self, order_id: str) -> bool:
        """Hazır olarak işaretle"""
        async with aiohttp.ClientSession() as session:
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            
            try:
                async with session.post(
                    f"{self.BASE_URL}/orders/{order_id}/ready",
                    headers=headers
                ) as response:
                    return response.status == 200
            except Exception as e:
                logger.error(f"Getir ready error: {e}")
                return False


class TrendyolClient:
    """Trendyol Yemek API Client"""
    
    BASE_URL = "https://api.trendyol.com/mealgw/suppliers"
    
    def __init__(self, api_key: str, api_secret: str, supplier_id: str):
        self.api_key = api_key
        self.api_secret = api_secret
        self.supplier_id = supplier_id
    
    def _get_auth_header(self) -> str:
        """Basic auth header"""
        import base64
        credentials = f"{self.api_key}:{self.api_secret}"
        encoded = base64.b64encode(credentials.encode()).decode()
        return f"Basic {encoded}"
    
    async def get_orders(self, status: Optional[str] = None) -> List[Dict]:
        """Aktif siparişleri getir"""
        async with aiohttp.ClientSession() as session:
            headers = {
                "Authorization": self._get_auth_header(),
                "Content-Type": "application/json"
            }
            params = {"size": 100}
            if status:
                params["status"] = status
            
            try:
                async with session.get(
                    f"{self.BASE_URL}/{self.supplier_id}/orders",
                    headers=headers,
                    params=params
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        return data.get("content", [])
                    return []
            except Exception as e:
                logger.error(f"Trendyol connection error: {e}")
                return []
    
    async def update_status(self, order_id: str, status: str) -> bool:
        """Sipariş durumu güncelle"""
        async with aiohttp.ClientSession() as session:
            headers = {
                "Authorization": self._get_auth_header(),
                "Content-Type": "application/json"
            }
            body = {"status": status}
            
            try:
                async with session.put(
                    f"{self.BASE_URL}/{self.supplier_id}/orders/{order_id}",
                    headers=headers,
                    json=body
                ) as response:
                    return response.status == 200
            except Exception as e:
                logger.error(f"Trendyol status error: {e}")
                return False


class MigrosClient:
    """Migros Yemek API Client"""
    
    BASE_URL = "https://api.migros.com.tr/yemek/v1"
    
    def __init__(self, api_key: str, store_id: str):
        self.api_key = api_key
        self.store_id = store_id
    
    async def get_orders(self) -> List[Dict]:
        """Aktif siparişleri getir"""
        async with aiohttp.ClientSession() as session:
            headers = {
                "X-Api-Key": self.api_key,
                "X-Store-Id": self.store_id,
                "Content-Type": "application/json"
            }
            
            try:
                async with session.get(
                    f"{self.BASE_URL}/orders/active",
                    headers=headers
                ) as response:
                    if response.status == 200:
                        return await response.json()
                    return []
            except Exception as e:
                logger.error(f"Migros connection error: {e}")
                return []
    
    async def accept_order(self, order_id: str, prep_time: int = 30) -> bool:
        """Siparişi kabul et"""
        async with aiohttp.ClientSession() as session:
            headers = {
                "X-Api-Key": self.api_key,
                "X-Store-Id": self.store_id,
                "Content-Type": "application/json"
            }
            body = {"preparationTime": prep_time}
            
            try:
                async with session.post(
                    f"{self.BASE_URL}/orders/{order_id}/accept",
                    headers=headers,
                    json=body
                ) as response:
                    return response.status == 200
            except Exception as e:
                logger.error(f"Migros accept error: {e}")
                return False


# Factory function
def get_platform_client(platform: str, config: Dict):
    """Platform ismine göre client döndür"""
    if platform == "yemeksepeti":
        return YemeksepetiClient(
            api_key=config.get("api_key"),
            api_secret=config.get("api_secret"),
            restaurant_id=config.get("restaurant_id")
        )
    elif platform == "getir":
        return GetirClient(
            api_key=config.get("api_key"),
            restaurant_id=config.get("restaurant_id")
        )
    elif platform == "trendyol":
        return TrendyolClient(
            api_key=config.get("api_key"),
            api_secret=config.get("api_secret"),
            supplier_id=config.get("supplier_id")
        )
    elif platform == "migros":
        return MigrosClient(
            api_key=config.get("api_key"),
            store_id=config.get("store_id")
        )
    else:
        raise ValueError(f"Unknown platform: {platform}")
