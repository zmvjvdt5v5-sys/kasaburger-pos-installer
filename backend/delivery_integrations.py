"""
Paket Servis Entegrasyonları - Merkezi Modül
Yemeksepeti, Trendyol Yemek, Getir Yemek, Migros Yemek
"""

import httpx
import hashlib
import hmac
import json
import logging
from datetime import datetime, timezone
from typing import Optional, Dict, List, Any
from enum import Enum

logger = logging.getLogger(__name__)


class DeliveryPlatform(str, Enum):
    YEMEKSEPETI = "yemeksepeti"
    TRENDYOL = "trendyol"
    GETIR = "getir"
    MIGROS = "migros"


class OrderStatus(str, Enum):
    NEW = "new"
    ACCEPTED = "accepted"
    PREPARING = "preparing"
    READY = "ready"
    ON_THE_WAY = "on_the_way"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"


class DeliveryOrder:
    """Standart sipariş modeli - tüm platformlardan gelen siparişler bu formata dönüştürülür"""
    def __init__(
        self,
        platform: DeliveryPlatform,
        platform_order_id: str,
        customer_name: str,
        customer_phone: str,
        customer_address: str,
        items: List[Dict],
        total: float,
        delivery_fee: float = 0,
        payment_method: str = "online",
        note: str = "",
        created_at: datetime = None,
        status: OrderStatus = OrderStatus.NEW
    ):
        self.platform = platform
        self.platform_order_id = platform_order_id
        self.customer_name = customer_name
        self.customer_phone = customer_phone
        self.customer_address = customer_address
        self.items = items
        self.total = total
        self.delivery_fee = delivery_fee
        self.payment_method = payment_method
        self.note = note
        self.created_at = created_at or datetime.now(timezone.utc)
        self.status = status

    def to_dict(self) -> Dict:
        return {
            "platform": self.platform.value,
            "platform_order_id": self.platform_order_id,
            "customer_name": self.customer_name,
            "customer_phone": self.customer_phone,
            "customer_address": self.customer_address,
            "items": self.items,
            "total": self.total,
            "delivery_fee": self.delivery_fee,
            "payment_method": self.payment_method,
            "note": self.note,
            "created_at": self.created_at.isoformat(),
            "status": self.status.value
        }


# ==================== YEMEKSEPETİ ====================

class YemeksepetiClient:
    """
    Yemeksepeti API Client
    Dokümantasyon: https://integration.yemeksepeti.com
    """
    
    BASE_URL = "https://integration.yemeksepeti.com/api/v1"
    
    def __init__(self, chain_code: str, remote_id: str, vendor_id: str, api_key: str = None):
        self.chain_code = chain_code
        self.remote_id = remote_id
        self.vendor_id = vendor_id
        self.api_key = api_key
        self.client = httpx.AsyncClient(timeout=30.0)
    
    def _get_headers(self) -> Dict:
        return {
            "Content-Type": "application/json",
            "X-Chain-Code": self.chain_code,
            "X-Remote-Id": self.remote_id,
            "X-Vendor-Id": self.vendor_id,
            "Authorization": f"Bearer {self.api_key}" if self.api_key else ""
        }
    
    async def get_orders(self, status: str = "new") -> List[Dict]:
        """Yeni siparişleri getir"""
        try:
            response = await self.client.get(
                f"{self.BASE_URL}/orders",
                headers=self._get_headers(),
                params={"status": status}
            )
            response.raise_for_status()
            return response.json().get("orders", [])
        except Exception as e:
            logger.error(f"Yemeksepeti get_orders error: {e}")
            return []
    
    async def accept_order(self, order_id: str, preparation_time: int = 30) -> bool:
        """Siparişi onayla"""
        try:
            response = await self.client.post(
                f"{self.BASE_URL}/orders/{order_id}/accept",
                headers=self._get_headers(),
                json={"preparationTime": preparation_time}
            )
            return response.status_code == 200
        except Exception as e:
            logger.error(f"Yemeksepeti accept_order error: {e}")
            return False
    
    async def reject_order(self, order_id: str, reason: str = "Restoran meşgul") -> bool:
        """Siparişi reddet"""
        try:
            response = await self.client.post(
                f"{self.BASE_URL}/orders/{order_id}/reject",
                headers=self._get_headers(),
                json={"reason": reason}
            )
            return response.status_code == 200
        except Exception as e:
            logger.error(f"Yemeksepeti reject_order error: {e}")
            return False
    
    async def update_status(self, order_id: str, status: str) -> bool:
        """Sipariş durumunu güncelle"""
        try:
            response = await self.client.post(
                f"{self.BASE_URL}/orders/{order_id}/status",
                headers=self._get_headers(),
                json={"status": status}
            )
            return response.status_code == 200
        except Exception as e:
            logger.error(f"Yemeksepeti update_status error: {e}")
            return False
    
    async def mark_ready(self, order_id: str) -> bool:
        """Sipariş hazır"""
        return await self.update_status(order_id, "ready_for_pickup")
    
    async def mark_delivered(self, order_id: str) -> bool:
        """Sipariş teslim edildi"""
        return await self.update_status(order_id, "delivered")
    
    def parse_order(self, raw_order: Dict) -> DeliveryOrder:
        """Yemeksepeti siparişini standart formata dönüştür"""
        items = []
        for item in raw_order.get("items", []):
            items.append({
                "name": item.get("name", ""),
                "quantity": item.get("quantity", 1),
                "price": item.get("price", 0),
                "note": item.get("note", ""),
                "options": item.get("options", [])
            })
        
        return DeliveryOrder(
            platform=DeliveryPlatform.YEMEKSEPETI,
            platform_order_id=raw_order.get("id", ""),
            customer_name=raw_order.get("customer", {}).get("name", ""),
            customer_phone=raw_order.get("customer", {}).get("phone", ""),
            customer_address=raw_order.get("delivery", {}).get("address", ""),
            items=items,
            total=raw_order.get("totalPrice", 0),
            delivery_fee=raw_order.get("deliveryFee", 0),
            payment_method=raw_order.get("paymentMethod", "online"),
            note=raw_order.get("note", "")
        )


# ==================== TRENDYOL YEMEK ====================

class TrendyolYemekClient:
    """
    Trendyol Yemek (Trendyol Go by Uber Eats) API Client
    Dokümantasyon: https://developers.tgoapps.com
    """
    
    BASE_URL = "https://api.trendyolgo.com/integration/restaurant/v1"
    
    def __init__(self, api_key: str, secret_key: str, restaurant_id: str, seller_id: str = None):
        self.api_key = api_key
        self.secret_key = secret_key
        self.restaurant_id = restaurant_id
        self.seller_id = seller_id
        self.client = httpx.AsyncClient(timeout=30.0)
    
    def _get_headers(self) -> Dict:
        return {
            "Content-Type": "application/json",
            "Authorization": f"Basic {self._get_auth_token()}",
            "X-Restaurant-Id": self.restaurant_id
        }
    
    def _get_auth_token(self) -> str:
        import base64
        credentials = f"{self.api_key}:{self.secret_key}"
        return base64.b64encode(credentials.encode()).decode()
    
    async def get_orders(self, status: str = "NEW") -> List[Dict]:
        """Yeni siparişleri getir"""
        try:
            response = await self.client.get(
                f"{self.BASE_URL}/orders",
                headers=self._get_headers(),
                params={"status": status, "restaurantId": self.restaurant_id}
            )
            response.raise_for_status()
            return response.json().get("content", [])
        except Exception as e:
            logger.error(f"Trendyol get_orders error: {e}")
            return []
    
    async def accept_order(self, order_id: str, preparation_time: int = 30) -> bool:
        """Siparişi onayla"""
        try:
            response = await self.client.put(
                f"{self.BASE_URL}/orders/{order_id}/accept",
                headers=self._get_headers(),
                json={"preparationTime": preparation_time}
            )
            return response.status_code in [200, 204]
        except Exception as e:
            logger.error(f"Trendyol accept_order error: {e}")
            return False
    
    async def reject_order(self, order_id: str, reason: str = "BUSY") -> bool:
        """Siparişi reddet"""
        try:
            response = await self.client.put(
                f"{self.BASE_URL}/orders/{order_id}/cancel",
                headers=self._get_headers(),
                json={"cancelReason": reason}
            )
            return response.status_code in [200, 204]
        except Exception as e:
            logger.error(f"Trendyol reject_order error: {e}")
            return False
    
    async def mark_ready(self, order_id: str) -> bool:
        """Sipariş hazır"""
        try:
            response = await self.client.put(
                f"{self.BASE_URL}/orders/{order_id}/ready",
                headers=self._get_headers()
            )
            return response.status_code in [200, 204]
        except Exception as e:
            logger.error(f"Trendyol mark_ready error: {e}")
            return False
    
    async def mark_delivered(self, order_id: str) -> bool:
        """Sipariş teslim edildi"""
        try:
            response = await self.client.put(
                f"{self.BASE_URL}/orders/{order_id}/delivered",
                headers=self._get_headers()
            )
            return response.status_code in [200, 204]
        except Exception as e:
            logger.error(f"Trendyol mark_delivered error: {e}")
            return False
    
    def parse_order(self, raw_order: Dict) -> DeliveryOrder:
        """Trendyol siparişini standart formata dönüştür"""
        items = []
        for item in raw_order.get("lines", []):
            items.append({
                "name": item.get("productName", ""),
                "quantity": item.get("quantity", 1),
                "price": item.get("price", 0),
                "note": item.get("note", ""),
                "options": item.get("selectedOptions", [])
            })
        
        customer = raw_order.get("customer", {})
        delivery = raw_order.get("deliveryAddress", {})
        
        return DeliveryOrder(
            platform=DeliveryPlatform.TRENDYOL,
            platform_order_id=raw_order.get("id", ""),
            customer_name=customer.get("fullName", ""),
            customer_phone=customer.get("phone", ""),
            customer_address=f"{delivery.get('fullAddress', '')} {delivery.get('addressDescription', '')}",
            items=items,
            total=raw_order.get("totalPrice", 0),
            delivery_fee=raw_order.get("deliveryFee", 0),
            payment_method=raw_order.get("paymentMethod", "ONLINE"),
            note=raw_order.get("customerNote", "")
        )


# ==================== GETİR YEMEK ====================

class GetirYemekClient:
    """
    Getir Yemek API Client
    Dokümantasyon: https://developers.getir.com/food/api-documentation
    """
    
    BASE_URL = "https://food-external-api.getirapi.com/api/v1"
    
    def __init__(self, api_key: str, secret_key: str, restaurant_id: str):
        self.api_key = api_key
        self.secret_key = secret_key
        self.restaurant_id = restaurant_id
        self.client = httpx.AsyncClient(timeout=30.0)
        self.access_token = None
    
    async def _get_access_token(self) -> str:
        """OAuth token al"""
        if self.access_token:
            return self.access_token
        
        try:
            response = await self.client.post(
                "https://food-external-api.getirapi.com/api/v1/auth/token",
                json={
                    "apiKey": self.api_key,
                    "apiSecret": self.secret_key
                }
            )
            response.raise_for_status()
            self.access_token = response.json().get("token")
            return self.access_token
        except Exception as e:
            logger.error(f"Getir auth error: {e}")
            return ""
    
    def _get_headers(self) -> Dict:
        return {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.access_token}",
            "X-Restaurant-Id": self.restaurant_id
        }
    
    async def get_orders(self, status: str = "new") -> List[Dict]:
        """Yeni siparişleri getir"""
        try:
            await self._get_access_token()
            response = await self.client.get(
                f"{self.BASE_URL}/orders",
                headers=self._get_headers(),
                params={"status": status}
            )
            response.raise_for_status()
            return response.json().get("data", [])
        except Exception as e:
            logger.error(f"Getir get_orders error: {e}")
            return []
    
    async def accept_order(self, order_id: str, preparation_time: int = 30) -> bool:
        """Siparişi onayla"""
        try:
            await self._get_access_token()
            response = await self.client.post(
                f"{self.BASE_URL}/orders/{order_id}/confirm",
                headers=self._get_headers(),
                json={"preparationTime": preparation_time}
            )
            return response.status_code in [200, 201]
        except Exception as e:
            logger.error(f"Getir accept_order error: {e}")
            return False
    
    async def reject_order(self, order_id: str, reason: str = "BUSY") -> bool:
        """Siparişi reddet"""
        try:
            await self._get_access_token()
            response = await self.client.post(
                f"{self.BASE_URL}/orders/{order_id}/cancel",
                headers=self._get_headers(),
                json={"reason": reason}
            )
            return response.status_code in [200, 201]
        except Exception as e:
            logger.error(f"Getir reject_order error: {e}")
            return False
    
    async def mark_ready(self, order_id: str) -> bool:
        """Sipariş hazır"""
        try:
            await self._get_access_token()
            response = await self.client.post(
                f"{self.BASE_URL}/orders/{order_id}/prepare",
                headers=self._get_headers()
            )
            return response.status_code in [200, 201]
        except Exception as e:
            logger.error(f"Getir mark_ready error: {e}")
            return False
    
    async def hand_over(self, order_id: str) -> bool:
        """Kuryeye teslim edildi"""
        try:
            await self._get_access_token()
            response = await self.client.post(
                f"{self.BASE_URL}/orders/{order_id}/handover",
                headers=self._get_headers()
            )
            return response.status_code in [200, 201]
        except Exception as e:
            logger.error(f"Getir hand_over error: {e}")
            return False
    
    def parse_order(self, raw_order: Dict) -> DeliveryOrder:
        """Getir siparişini standart formata dönüştür"""
        items = []
        for item in raw_order.get("products", []):
            items.append({
                "name": item.get("name", ""),
                "quantity": item.get("count", 1),
                "price": item.get("price", 0),
                "note": item.get("optionNote", ""),
                "options": item.get("optionCategories", [])
            })
        
        client = raw_order.get("client", {})
        
        return DeliveryOrder(
            platform=DeliveryPlatform.GETIR,
            platform_order_id=raw_order.get("id", ""),
            customer_name=client.get("name", ""),
            customer_phone=client.get("phoneNumber", ""),
            customer_address=raw_order.get("clientAddress", {}).get("address", ""),
            items=items,
            total=raw_order.get("totalPrice", 0),
            delivery_fee=raw_order.get("courierFee", 0),
            payment_method=raw_order.get("paymentMethodText", "Online"),
            note=raw_order.get("clientNote", "")
        )


# ==================== MİGROS YEMEK ====================

class MigrosYemekClient:
    """
    Migros Yemek API Client
    API Key restoran panelinden alınır
    """
    
    BASE_URL = "https://api.migrosyemek.com/api/v1"
    
    def __init__(self, api_key: str, store_id: str = None):
        self.api_key = api_key
        self.store_id = store_id
        self.client = httpx.AsyncClient(timeout=30.0)
    
    def _get_headers(self) -> Dict:
        return {
            "Content-Type": "application/json",
            "X-API-Key": self.api_key,
            "X-Store-Id": self.store_id or ""
        }
    
    async def get_orders(self, status: str = "PENDING") -> List[Dict]:
        """Yeni siparişleri getir"""
        try:
            response = await self.client.get(
                f"{self.BASE_URL}/orders",
                headers=self._get_headers(),
                params={"status": status}
            )
            response.raise_for_status()
            return response.json().get("orders", [])
        except Exception as e:
            logger.error(f"Migros get_orders error: {e}")
            return []
    
    async def accept_order(self, order_id: str, preparation_time: int = 30) -> bool:
        """Siparişi onayla"""
        try:
            response = await self.client.post(
                f"{self.BASE_URL}/orders/{order_id}/accept",
                headers=self._get_headers(),
                json={"estimatedPreparationTime": preparation_time}
            )
            return response.status_code == 200
        except Exception as e:
            logger.error(f"Migros accept_order error: {e}")
            return False
    
    async def reject_order(self, order_id: str, reason: str = "RESTAURANT_BUSY") -> bool:
        """Siparişi reddet"""
        try:
            response = await self.client.post(
                f"{self.BASE_URL}/orders/{order_id}/reject",
                headers=self._get_headers(),
                json={"reason": reason}
            )
            return response.status_code == 200
        except Exception as e:
            logger.error(f"Migros reject_order error: {e}")
            return False
    
    async def mark_ready(self, order_id: str) -> bool:
        """Sipariş hazır"""
        try:
            response = await self.client.post(
                f"{self.BASE_URL}/orders/{order_id}/ready",
                headers=self._get_headers()
            )
            return response.status_code == 200
        except Exception as e:
            logger.error(f"Migros mark_ready error: {e}")
            return False
    
    async def mark_delivered(self, order_id: str) -> bool:
        """Sipariş teslim edildi"""
        try:
            response = await self.client.post(
                f"{self.BASE_URL}/orders/{order_id}/delivered",
                headers=self._get_headers()
            )
            return response.status_code == 200
        except Exception as e:
            logger.error(f"Migros mark_delivered error: {e}")
            return False
    
    def parse_order(self, raw_order: Dict) -> DeliveryOrder:
        """Migros siparişini standart formata dönüştür"""
        items = []
        for item in raw_order.get("items", []):
            items.append({
                "name": item.get("productName", ""),
                "quantity": item.get("quantity", 1),
                "price": item.get("unitPrice", 0),
                "note": item.get("note", ""),
                "options": item.get("options", [])
            })
        
        return DeliveryOrder(
            platform=DeliveryPlatform.MIGROS,
            platform_order_id=raw_order.get("orderId", ""),
            customer_name=raw_order.get("customerName", ""),
            customer_phone=raw_order.get("customerPhone", ""),
            customer_address=raw_order.get("deliveryAddress", ""),
            items=items,
            total=raw_order.get("totalAmount", 0),
            delivery_fee=raw_order.get("deliveryFee", 0),
            payment_method=raw_order.get("paymentType", "ONLINE"),
            note=raw_order.get("orderNote", "")
        )


# ==================== ENTEGRASYON YÖNETİCİSİ ====================

class DeliveryIntegrationManager:
    """
    Tüm paket servis platformlarını yöneten ana sınıf
    """
    
    def __init__(self, db):
        self.db = db
        self.clients: Dict[DeliveryPlatform, Any] = {}
        self.polling_active = False
    
    async def initialize_client(self, platform: DeliveryPlatform, credentials: Dict) -> bool:
        """Platform client'ını başlat"""
        try:
            if platform == DeliveryPlatform.YEMEKSEPETI:
                self.clients[platform] = YemeksepetiClient(
                    chain_code=credentials.get("chain_code", ""),
                    remote_id=credentials.get("remote_id", ""),
                    vendor_id=credentials.get("vendor_id", ""),
                    api_key=credentials.get("api_key", "")
                )
            elif platform == DeliveryPlatform.TRENDYOL:
                self.clients[platform] = TrendyolYemekClient(
                    api_key=credentials.get("api_key", ""),
                    secret_key=credentials.get("secret_key", ""),
                    restaurant_id=credentials.get("restaurant_id", ""),
                    seller_id=credentials.get("seller_id", "")
                )
            elif platform == DeliveryPlatform.GETIR:
                self.clients[platform] = GetirYemekClient(
                    api_key=credentials.get("api_key", ""),
                    secret_key=credentials.get("secret_key", ""),
                    restaurant_id=credentials.get("restaurant_id", "")
                )
            elif platform == DeliveryPlatform.MIGROS:
                self.clients[platform] = MigrosYemekClient(
                    api_key=credentials.get("api_key", ""),
                    store_id=credentials.get("store_id", "")
                )
            
            logger.info(f"{platform.value} client initialized")
            return True
        except Exception as e:
            logger.error(f"Failed to initialize {platform.value}: {e}")
            return False
    
    async def fetch_orders(self, platform: DeliveryPlatform) -> List[DeliveryOrder]:
        """Belirli platformdan siparişleri çek"""
        client = self.clients.get(platform)
        if not client:
            return []
        
        raw_orders = await client.get_orders()
        return [client.parse_order(order) for order in raw_orders]
    
    async def fetch_all_orders(self) -> List[DeliveryOrder]:
        """Tüm platformlardan siparişleri çek"""
        all_orders = []
        for platform in self.clients:
            orders = await self.fetch_orders(platform)
            all_orders.extend(orders)
        return all_orders
    
    async def accept_order(self, platform: DeliveryPlatform, order_id: str, prep_time: int = 30) -> bool:
        """Siparişi onayla"""
        client = self.clients.get(platform)
        if not client:
            return False
        return await client.accept_order(order_id, prep_time)
    
    async def reject_order(self, platform: DeliveryPlatform, order_id: str, reason: str = "") -> bool:
        """Siparişi reddet"""
        client = self.clients.get(platform)
        if not client:
            return False
        return await client.reject_order(order_id, reason)
    
    async def mark_ready(self, platform: DeliveryPlatform, order_id: str) -> bool:
        """Sipariş hazır"""
        client = self.clients.get(platform)
        if not client:
            return False
        return await client.mark_ready(order_id)
    
    async def save_order_to_db(self, order: DeliveryOrder) -> str:
        """Siparişi veritabanına kaydet"""
        order_data = order.to_dict()
        order_data["_internal_id"] = f"{order.platform.value}_{order.platform_order_id}"
        
        # Duplicate kontrolü
        existing = await self.db.delivery_orders.find_one({
            "_internal_id": order_data["_internal_id"]
        })
        
        if existing:
            return str(existing.get("_internal_id"))
        
        result = await self.db.delivery_orders.insert_one(order_data)
        return order_data["_internal_id"]
    
    async def get_platform_settings(self, platform: DeliveryPlatform) -> Dict:
        """Platform ayarlarını getir"""
        settings = await self.db.delivery_settings.find_one({"platform": platform.value})
        if settings:
            settings.pop("_id", None)
        return settings or {}
    
    async def save_platform_settings(self, platform: DeliveryPlatform, settings: Dict) -> bool:
        """Platform ayarlarını kaydet"""
        settings["platform"] = platform.value
        settings["updated_at"] = datetime.now(timezone.utc).isoformat()
        
        await self.db.delivery_settings.update_one(
            {"platform": platform.value},
            {"$set": settings},
            upsert=True
        )
        return True
