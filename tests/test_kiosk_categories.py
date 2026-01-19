"""
Test Kiosk Category Management APIs
Tests: GET, POST, PUT, DELETE /api/kiosk/categories and /api/kiosk/categories/reorder
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestKioskCategoryAPIs:
    """Kiosk Category CRUD and Reorder Tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup - get auth token"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login to get token
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@kasaburger.net.tr",
            "password": "admin123"
        })
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        
        token_data = login_response.json()
        self.token = token_data.get("access_token")  # Note: access_token not token
        assert self.token, "No access_token in response"
        
        self.session.headers.update({"Authorization": f"Bearer {self.token}"})
    
    # ==================== GET CATEGORIES ====================
    
    def test_get_categories_returns_list(self):
        """GET /api/kiosk/categories - Should return list of categories"""
        response = self.session.get(f"{BASE_URL}/api/kiosk/categories")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        
        # Should have default categories (6)
        print(f"Categories count: {len(data)}")
        
        # Verify category structure
        if len(data) > 0:
            cat = data[0]
            assert "id" in cat, "Category should have 'id'"
            assert "name" in cat, "Category should have 'name'"
            assert "icon" in cat, "Category should have 'icon'"
            assert "order" in cat, "Category should have 'order'"
            print(f"First category: {cat['name']} ({cat['icon']})")
    
    def test_get_categories_sorted_by_order(self):
        """GET /api/kiosk/categories - Should be sorted by order"""
        response = self.session.get(f"{BASE_URL}/api/kiosk/categories")
        
        assert response.status_code == 200
        data = response.json()
        
        if len(data) > 1:
            orders = [cat.get("order", 0) for cat in data]
            assert orders == sorted(orders), f"Categories not sorted by order: {orders}"
            print(f"Categories sorted correctly: {orders}")
    
    # ==================== CREATE CATEGORY ====================
    
    def test_create_category_success(self):
        """POST /api/kiosk/categories - Should create new category"""
        unique_name = f"TEST_Category_{uuid.uuid4().hex[:6]}"
        
        response = self.session.post(f"{BASE_URL}/api/kiosk/categories", json={
            "name": unique_name,
            "icon": "🧪",
            "order": 99,
            "is_active": True
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("name") == unique_name, f"Name mismatch: {data.get('name')}"
        assert data.get("icon") == "🧪", f"Icon mismatch: {data.get('icon')}"
        assert "id" in data, "Response should have 'id'"
        
        print(f"Created category: {data['id']} - {data['name']}")
        
        # Store for cleanup
        self.created_category_id = data["id"]
        
        # Verify persistence with GET
        get_response = self.session.get(f"{BASE_URL}/api/kiosk/categories")
        assert get_response.status_code == 200
        
        categories = get_response.json()
        found = any(c.get("id") == data["id"] for c in categories)
        assert found, "Created category not found in GET response"
        
        # Cleanup
        self.session.delete(f"{BASE_URL}/api/kiosk/categories/{data['id']}")
    
    def test_create_category_without_auth_fails(self):
        """POST /api/kiosk/categories - Should fail without auth"""
        no_auth_session = requests.Session()
        no_auth_session.headers.update({"Content-Type": "application/json"})
        
        response = no_auth_session.post(f"{BASE_URL}/api/kiosk/categories", json={
            "name": "Unauthorized Category",
            "icon": "❌"
        })
        
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print(f"Correctly rejected unauthorized request: {response.status_code}")
    
    # ==================== UPDATE CATEGORY ====================
    
    def test_update_category_success(self):
        """PUT /api/kiosk/categories/{id} - Should update category"""
        # First create a category
        create_response = self.session.post(f"{BASE_URL}/api/kiosk/categories", json={
            "name": f"TEST_Update_{uuid.uuid4().hex[:6]}",
            "icon": "📝",
            "order": 98
        })
        assert create_response.status_code == 200
        category_id = create_response.json()["id"]
        
        # Update it
        new_name = f"TEST_Updated_{uuid.uuid4().hex[:6]}"
        update_response = self.session.put(f"{BASE_URL}/api/kiosk/categories/{category_id}", json={
            "name": new_name,
            "icon": "✅",
            "order": 97,
            "is_active": True
        })
        
        assert update_response.status_code == 200, f"Expected 200, got {update_response.status_code}: {update_response.text}"
        
        data = update_response.json()
        assert data.get("new_name") == new_name or data.get("status") == "success", f"Update response: {data}"
        print(f"Updated category {category_id} to {new_name}")
        
        # Verify persistence
        get_response = self.session.get(f"{BASE_URL}/api/kiosk/categories")
        categories = get_response.json()
        updated_cat = next((c for c in categories if c.get("id") == category_id), None)
        
        assert updated_cat is not None, "Updated category not found"
        assert updated_cat.get("name") == new_name, f"Name not updated: {updated_cat.get('name')}"
        assert updated_cat.get("icon") == "✅", f"Icon not updated: {updated_cat.get('icon')}"
        
        # Cleanup
        self.session.delete(f"{BASE_URL}/api/kiosk/categories/{category_id}")
    
    # ==================== DELETE CATEGORY ====================
    
    def test_delete_category_success(self):
        """DELETE /api/kiosk/categories/{id} - Should delete empty category"""
        # Create a category to delete
        create_response = self.session.post(f"{BASE_URL}/api/kiosk/categories", json={
            "name": f"TEST_Delete_{uuid.uuid4().hex[:6]}",
            "icon": "🗑️",
            "order": 100
        })
        assert create_response.status_code == 200
        category_id = create_response.json()["id"]
        
        # Delete it
        delete_response = self.session.delete(f"{BASE_URL}/api/kiosk/categories/{category_id}")
        
        assert delete_response.status_code == 200, f"Expected 200, got {delete_response.status_code}: {delete_response.text}"
        
        data = delete_response.json()
        assert data.get("status") == "deleted", f"Delete response: {data}"
        print(f"Deleted category {category_id}")
        
        # Verify deletion
        get_response = self.session.get(f"{BASE_URL}/api/kiosk/categories")
        categories = get_response.json()
        found = any(c.get("id") == category_id for c in categories)
        assert not found, "Deleted category still exists"
    
    def test_delete_category_with_products_fails(self):
        """DELETE /api/kiosk/categories/{id} - Should fail if category has products"""
        # Get categories
        response = self.session.get(f"{BASE_URL}/api/kiosk/categories")
        categories = response.json()
        
        # Find a category that likely has products (Et Burger, Premium, etc.)
        category_with_products = None
        for cat in categories:
            if cat.get("name") in ["Et Burger", "Premium", "Tavuk", "Yan Ürün", "İçecek", "Tatlı"]:
                category_with_products = cat
                break
        
        if category_with_products:
            delete_response = self.session.delete(f"{BASE_URL}/api/kiosk/categories/{category_with_products['id']}")
            
            # Should fail with 400 because category has products
            assert delete_response.status_code == 400, f"Expected 400, got {delete_response.status_code}: {delete_response.text}"
            print(f"Correctly rejected deletion of category with products: {category_with_products['name']}")
        else:
            pytest.skip("No category with products found to test")
    
    # ==================== REORDER CATEGORIES ====================
    
    def test_reorder_categories_success(self):
        """PUT /api/kiosk/categories/reorder - Should reorder categories"""
        # Get current categories
        get_response = self.session.get(f"{BASE_URL}/api/kiosk/categories")
        assert get_response.status_code == 200
        
        categories = get_response.json()
        if len(categories) < 2:
            pytest.skip("Need at least 2 categories to test reorder")
        
        # Reverse the order
        category_ids = [c["id"] for c in categories]
        reversed_ids = list(reversed(category_ids))
        
        # Reorder
        reorder_response = self.session.put(f"{BASE_URL}/api/kiosk/categories/reorder", json={
            "category_ids": reversed_ids
        })
        
        assert reorder_response.status_code == 200, f"Expected 200, got {reorder_response.status_code}: {reorder_response.text}"
        
        data = reorder_response.json()
        assert data.get("status") == "success", f"Reorder response: {data}"
        print(f"Reordered categories: {reversed_ids}")
        
        # Verify new order
        verify_response = self.session.get(f"{BASE_URL}/api/kiosk/categories")
        new_categories = verify_response.json()
        new_ids = [c["id"] for c in new_categories]
        
        assert new_ids == reversed_ids, f"Order not updated. Expected {reversed_ids}, got {new_ids}"
        
        # Restore original order
        self.session.put(f"{BASE_URL}/api/kiosk/categories/reorder", json={
            "category_ids": category_ids
        })
    
    # ==================== PRODUCTS TAB ====================
    
    def test_get_products_returns_list(self):
        """GET /api/kiosk/products - Should return list of products"""
        response = self.session.get(f"{BASE_URL}/api/kiosk/products")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"Products count: {len(data)}")
        
        if len(data) > 0:
            product = data[0]
            assert "id" in product, "Product should have 'id'"
            assert "name" in product, "Product should have 'name'"
            assert "category" in product, "Product should have 'category'"
            assert "price" in product, "Product should have 'price'"
            print(f"First product: {product['name']} - {product['category']} - {product['price']} TL")


class TestKioskProductAPIs:
    """Kiosk Product CRUD Tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup - get auth token"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@kasaburger.net.tr",
            "password": "admin123"
        })
        assert login_response.status_code == 200
        
        token_data = login_response.json()
        self.token = token_data.get("access_token")
        self.session.headers.update({"Authorization": f"Bearer {self.token}"})
    
    def test_create_product_success(self):
        """POST /api/kiosk/products - Should create new product"""
        unique_name = f"TEST_Product_{uuid.uuid4().hex[:6]}"
        
        response = self.session.post(f"{BASE_URL}/api/kiosk/products", json={
            "name": unique_name,
            "category": "Et Burger",
            "price": 999.99,
            "description": "Test product description",
            "available": True
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("name") == unique_name
        assert data.get("price") == 999.99
        assert "id" in data
        
        print(f"Created product: {data['id']} - {data['name']}")
        
        # Cleanup
        self.session.delete(f"{BASE_URL}/api/kiosk/products/{data['id']}")
    
    def test_update_product_success(self):
        """PUT /api/kiosk/products/{id} - Should update product"""
        # Create product
        create_response = self.session.post(f"{BASE_URL}/api/kiosk/products", json={
            "name": f"TEST_Update_{uuid.uuid4().hex[:6]}",
            "category": "Et Burger",
            "price": 100
        })
        assert create_response.status_code == 200
        product_id = create_response.json()["id"]
        
        # Update
        new_name = f"TEST_Updated_{uuid.uuid4().hex[:6]}"
        update_response = self.session.put(f"{BASE_URL}/api/kiosk/products/{product_id}", json={
            "name": new_name,
            "category": "Premium",
            "price": 200
        })
        
        assert update_response.status_code == 200, f"Expected 200, got {update_response.status_code}: {update_response.text}"
        
        data = update_response.json()
        assert data.get("name") == new_name
        assert data.get("price") == 200
        
        print(f"Updated product {product_id}")
        
        # Cleanup
        self.session.delete(f"{BASE_URL}/api/kiosk/products/{product_id}")
    
    def test_delete_product_success(self):
        """DELETE /api/kiosk/products/{id} - Should delete product"""
        # Create product
        create_response = self.session.post(f"{BASE_URL}/api/kiosk/products", json={
            "name": f"TEST_Delete_{uuid.uuid4().hex[:6]}",
            "category": "Et Burger",
            "price": 50
        })
        assert create_response.status_code == 200
        product_id = create_response.json()["id"]
        
        # Delete
        delete_response = self.session.delete(f"{BASE_URL}/api/kiosk/products/{product_id}")
        
        assert delete_response.status_code == 200, f"Expected 200, got {delete_response.status_code}: {delete_response.text}"
        
        data = delete_response.json()
        assert data.get("status") == "deleted"
        
        print(f"Deleted product {product_id}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
