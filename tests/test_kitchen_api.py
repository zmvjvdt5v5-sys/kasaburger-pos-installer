"""
Kitchen API Tests - Birleşik Mutfak Yönetim Sistemi
Tests for unified kitchen display, order status updates, and salon display
"""
import pytest
import requests
import os
import uuid
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestKitchenAPI:
    """Kitchen endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test fixtures"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login to get token
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@kasaburger.net.tr",
            "password": "admin123"
        })
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        self.token = login_response.json().get("access_token")
        self.session.headers.update({"Authorization": f"Bearer {self.token}"})
    
    # ==================== SALON DISPLAY (NO AUTH) ====================
    
    def test_salon_display_no_auth_required(self):
        """GET /api/kitchen/salon-display should work without authentication"""
        # Use a fresh session without auth
        response = requests.get(f"{BASE_URL}/api/kitchen/salon-display")
        assert response.status_code == 200, f"Salon display should not require auth: {response.text}"
        
        data = response.json()
        assert "ready_orders" in data, "Response should contain ready_orders"
        assert "timestamp" in data, "Response should contain timestamp"
        assert isinstance(data["ready_orders"], list), "ready_orders should be a list"
    
    # ==================== KITCHEN ORDERS (AUTH REQUIRED) ====================
    
    def test_kitchen_orders_requires_auth(self):
        """GET /api/kitchen/orders should require authentication"""
        response = requests.get(f"{BASE_URL}/api/kitchen/orders")
        assert response.status_code in [401, 403], "Kitchen orders should require auth"
    
    def test_get_kitchen_orders(self):
        """GET /api/kitchen/orders - Get all kitchen orders"""
        response = self.session.get(f"{BASE_URL}/api/kitchen/orders")
        assert response.status_code == 200, f"Failed to get kitchen orders: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        
        # Check order structure if orders exist
        if len(data) > 0:
            order = data[0]
            assert "id" in order, "Order should have id"
            assert "order_source" in order, "Order should have order_source"
            assert "display_code" in order, "Order should have display_code"
            assert "code_type" in order, "Order should have code_type"
    
    def test_get_kitchen_orders_with_status_filter(self):
        """GET /api/kitchen/orders?status=pending - Filter by status"""
        response = self.session.get(f"{BASE_URL}/api/kitchen/orders?status=pending")
        assert response.status_code == 200, f"Failed to filter orders: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
    
    # ==================== KITCHEN STATS ====================
    
    def test_kitchen_stats_requires_auth(self):
        """GET /api/kitchen/stats should require authentication"""
        response = requests.get(f"{BASE_URL}/api/kitchen/stats")
        assert response.status_code in [401, 403], "Kitchen stats should require auth"
    
    def test_get_kitchen_stats(self):
        """GET /api/kitchen/stats - Get kitchen statistics"""
        response = self.session.get(f"{BASE_URL}/api/kitchen/stats")
        assert response.status_code == 200, f"Failed to get kitchen stats: {response.text}"
        
        data = response.json()
        assert "pending" in data, "Stats should have pending count"
        assert "preparing" in data, "Stats should have preparing count"
        assert "ready" in data, "Stats should have ready count"
        assert "breakdown" in data, "Stats should have breakdown by source"
        
        # Check breakdown structure
        breakdown = data["breakdown"]
        assert "pos" in breakdown, "Breakdown should have pos"
        assert "kiosk" in breakdown, "Breakdown should have kiosk"
        assert "delivery" in breakdown, "Breakdown should have delivery"
    
    # ==================== ORDER STATUS UPDATE ====================
    
    def test_update_order_status_requires_auth(self):
        """PUT /api/kitchen/orders/{id}/status should require authentication"""
        response = requests.put(
            f"{BASE_URL}/api/kitchen/orders/test-id/status",
            json={"status": "preparing"}
        )
        assert response.status_code in [401, 403], "Status update should require auth"
    
    def test_update_order_status_not_found(self):
        """PUT /api/kitchen/orders/{id}/status - Non-existent order"""
        fake_id = str(uuid.uuid4())
        response = self.session.put(
            f"{BASE_URL}/api/kitchen/orders/{fake_id}/status",
            json={"status": "preparing"}
        )
        assert response.status_code == 404, f"Should return 404 for non-existent order: {response.text}"
    
    def test_update_order_status_flow(self):
        """Test full order status flow: pending -> preparing -> ready -> served"""
        # First create a test order
        order_response = self.session.post(f"{BASE_URL}/api/pos/orders", json={
            "source": "takeaway",
            "items": [{"product_id": "test", "product_name": "Test Burger", "price": 99.9, "quantity": 1}],
            "customer_name": "TEST_StatusFlow"
        })
        assert order_response.status_code == 200, f"Failed to create order: {order_response.text}"
        
        order_data = order_response.json()
        order_id = order_data["order"]["id"]
        
        # Test status transitions
        statuses = ["preparing", "ready", "served"]
        for status in statuses:
            response = self.session.put(
                f"{BASE_URL}/api/kitchen/orders/{order_id}/status",
                json={"status": status}
            )
            assert response.status_code == 200, f"Failed to update to {status}: {response.text}"
            
            data = response.json()
            assert data["status"] == "success", f"Status update should succeed"
            assert data["new_status"] == status, f"New status should be {status}"
    
    # ==================== QUEUE NUMBER ASSIGNMENT ====================
    
    def test_pos_order_queue_number_takeaway(self):
        """POST /api/pos/orders - Takeaway order gets PKT-XXXX queue number"""
        response = self.session.post(f"{BASE_URL}/api/pos/orders", json={
            "source": "takeaway",
            "items": [{"product_id": "test", "product_name": "Test Burger", "price": 99.9, "quantity": 1}],
            "customer_name": "TEST_QueueTakeaway"
        })
        assert response.status_code == 200, f"Failed to create takeaway order: {response.text}"
        
        data = response.json()
        order = data["order"]
        assert "queue_number" in order, "Order should have queue_number"
        assert order["queue_number"].startswith("PKT-"), f"Takeaway queue should start with PKT-: {order['queue_number']}"
    
    def test_pos_order_queue_number_table(self):
        """POST /api/pos/orders - Table order gets MASA-X queue number"""
        response = self.session.post(f"{BASE_URL}/api/pos/orders", json={
            "source": "table",
            "table_id": "table-1",
            "items": [{"product_id": "test", "product_name": "Test Burger", "price": 99.9, "quantity": 1}],
            "customer_name": "TEST_QueueTable"
        })
        assert response.status_code == 200, f"Failed to create table order: {response.text}"
        
        data = response.json()
        order = data["order"]
        assert "queue_number" in order, "Order should have queue_number"
        assert order["queue_number"].startswith("MASA-"), f"Table queue should start with MASA-: {order['queue_number']}"
    
    # ==================== READY ORDERS ====================
    
    def test_get_ready_orders(self):
        """GET /api/kitchen/orders/ready - Get ready orders"""
        response = self.session.get(f"{BASE_URL}/api/kitchen/orders/ready")
        assert response.status_code == 200, f"Failed to get ready orders: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
    
    # ==================== PRINT ENDPOINT (MOCKED) ====================
    
    def test_print_endpoint_exists(self):
        """POST /api/kitchen/print - Print endpoint should exist (mocked)"""
        # Create a test order first
        order_response = self.session.post(f"{BASE_URL}/api/pos/orders", json={
            "source": "takeaway",
            "items": [{"product_id": "test", "product_name": "Test Burger", "price": 99.9, "quantity": 1}],
            "customer_name": "TEST_Print"
        })
        order_id = order_response.json()["order"]["id"]
        
        response = self.session.post(f"{BASE_URL}/api/kitchen/print", json={
            "order_id": order_id,
            "printer_ip": "192.168.1.100"
        })
        # Should return success or connection error (printer not available)
        assert response.status_code in [200, 500], f"Print endpoint should exist: {response.text}"


class TestKitchenIntegration:
    """Integration tests for kitchen workflow"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test fixtures"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@kasaburger.net.tr",
            "password": "admin123"
        })
        self.token = login_response.json().get("access_token")
        self.session.headers.update({"Authorization": f"Bearer {self.token}"})
    
    def test_full_kitchen_workflow(self):
        """Test complete kitchen workflow: create order -> update status -> check salon display"""
        # 1. Create takeaway order
        order_response = self.session.post(f"{BASE_URL}/api/pos/orders", json={
            "source": "takeaway",
            "items": [{"product_id": "test", "product_name": "Workflow Burger", "price": 150, "quantity": 1}],
            "customer_name": "TEST_Workflow"
        })
        assert order_response.status_code == 200
        order = order_response.json()["order"]
        order_id = order["id"]
        queue_number = order["queue_number"]
        
        # 2. Verify order appears in kitchen orders
        kitchen_response = self.session.get(f"{BASE_URL}/api/kitchen/orders")
        assert kitchen_response.status_code == 200
        kitchen_orders = kitchen_response.json()
        order_ids = [o["id"] for o in kitchen_orders]
        assert order_id in order_ids, "New order should appear in kitchen orders"
        
        # 3. Update to preparing
        prep_response = self.session.put(
            f"{BASE_URL}/api/kitchen/orders/{order_id}/status",
            json={"status": "preparing"}
        )
        assert prep_response.status_code == 200
        
        # 4. Update to ready
        ready_response = self.session.put(
            f"{BASE_URL}/api/kitchen/orders/{order_id}/status",
            json={"status": "ready"}
        )
        assert ready_response.status_code == 200
        
        # 5. Check salon display (no auth)
        salon_response = requests.get(f"{BASE_URL}/api/kitchen/salon-display")
        assert salon_response.status_code == 200
        salon_data = salon_response.json()
        
        # Order should appear in ready_orders
        ready_codes = [o["display_code"] for o in salon_data["ready_orders"]]
        assert queue_number in ready_codes, f"Ready order {queue_number} should appear in salon display"
        
        # 6. Mark as served
        served_response = self.session.put(
            f"{BASE_URL}/api/kitchen/orders/{order_id}/status",
            json={"status": "served"}
        )
        assert served_response.status_code == 200


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
