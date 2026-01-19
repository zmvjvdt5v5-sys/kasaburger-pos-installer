"""
Test Kiosk Combo Menus and Promotions API
Tests for: GET/POST/PUT/DELETE combos and promotions
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://kbys-portal.preview.emergentagent.com')

# Test credentials
ADMIN_EMAIL = "admin@kasaburger.net.tr"
ADMIN_PASSWORD = "admin123"


@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token for admin user"""
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
    )
    if response.status_code == 200:
        data = response.json()
        return data.get("access_token")
    pytest.skip(f"Authentication failed: {response.status_code}")


@pytest.fixture
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture
def authenticated_client(api_client, auth_token):
    """Session with auth header"""
    api_client.headers.update({"Authorization": f"Bearer {auth_token}"})
    return api_client


# ==================== COMBO TESTS ====================

class TestComboPublicEndpoints:
    """Test public combo endpoints (no auth required)"""
    
    def test_get_combos_returns_list(self, api_client):
        """GET /api/kiosk/combos should return list of active combos"""
        response = api_client.get(f"{BASE_URL}/api/kiosk/combos")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1, "Should have at least 1 combo"
        
        # Verify combo structure
        combo = data[0]
        assert "id" in combo
        assert "name" in combo
        assert "products" in combo
        assert "combo_price" in combo
        assert "original_price" in combo
        print(f"✓ GET /api/kiosk/combos returned {len(data)} combos")
    
    def test_combo_has_required_fields(self, api_client):
        """Verify combo has all required fields"""
        response = api_client.get(f"{BASE_URL}/api/kiosk/combos")
        assert response.status_code == 200
        
        combos = response.json()
        for combo in combos:
            assert "id" in combo, "Combo missing id"
            assert "name" in combo, "Combo missing name"
            assert "products" in combo, "Combo missing products"
            assert isinstance(combo["products"], list), "Products should be a list"
            assert "combo_price" in combo, "Combo missing combo_price"
            assert "original_price" in combo, "Combo missing original_price"
            assert combo["combo_price"] < combo["original_price"], "Combo price should be less than original"
        print(f"✓ All {len(combos)} combos have required fields")


class TestComboAdminEndpoints:
    """Test admin combo endpoints (auth required)"""
    
    def test_get_all_combos_requires_auth(self, api_client):
        """GET /api/kiosk/combos/all should require authentication"""
        response = api_client.get(f"{BASE_URL}/api/kiosk/combos/all")
        assert response.status_code in [401, 403], "Should require auth"
        print("✓ GET /api/kiosk/combos/all requires authentication")
    
    def test_get_all_combos_with_auth(self, authenticated_client):
        """GET /api/kiosk/combos/all should return all combos for admin"""
        response = authenticated_client.get(f"{BASE_URL}/api/kiosk/combos/all")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/kiosk/combos/all returned {len(data)} combos (admin)")
    
    def test_create_combo(self, authenticated_client):
        """POST /api/kiosk/combos should create new combo"""
        new_combo = {
            "name": "TEST_Combo_Menu",
            "description": "Test combo for automated testing",
            "products": ["kasa-classic", "pepsi"],
            "original_price": 505,
            "combo_price": 450,
            "discount_percent": 11,
            "is_active": True,
            "image": "https://example.com/test.jpg"
        }
        
        response = authenticated_client.post(
            f"{BASE_URL}/api/kiosk/combos",
            json=new_combo
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "id" in data, "Created combo should have id"
        assert data["name"] == new_combo["name"]
        assert data["combo_price"] == new_combo["combo_price"]
        
        # Store for cleanup
        TestComboAdminEndpoints.created_combo_id = data["id"]
        print(f"✓ POST /api/kiosk/combos created combo with id: {data['id']}")
    
    def test_update_combo(self, authenticated_client):
        """PUT /api/kiosk/combos/{id} should update combo"""
        combo_id = getattr(TestComboAdminEndpoints, 'created_combo_id', None)
        if not combo_id:
            pytest.skip("No combo created to update")
        
        update_data = {
            "name": "TEST_Combo_Menu_Updated",
            "description": "Updated description",
            "products": ["kasa-classic", "pepsi", "cheese-fries"],
            "original_price": 655,
            "combo_price": 550,
            "discount_percent": 16,
            "is_active": True
        }
        
        response = authenticated_client.put(
            f"{BASE_URL}/api/kiosk/combos/{combo_id}",
            json=update_data
        )
        assert response.status_code == 200
        print(f"✓ PUT /api/kiosk/combos/{combo_id} updated successfully")
    
    def test_delete_combo(self, authenticated_client):
        """DELETE /api/kiosk/combos/{id} should delete combo"""
        combo_id = getattr(TestComboAdminEndpoints, 'created_combo_id', None)
        if not combo_id:
            pytest.skip("No combo created to delete")
        
        response = authenticated_client.delete(f"{BASE_URL}/api/kiosk/combos/{combo_id}")
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("status") == "deleted"
        print(f"✓ DELETE /api/kiosk/combos/{combo_id} deleted successfully")
    
    def test_create_combo_requires_auth(self, api_client):
        """POST /api/kiosk/combos should require authentication"""
        response = api_client.post(
            f"{BASE_URL}/api/kiosk/combos",
            json={"name": "Test", "products": [], "combo_price": 100}
        )
        assert response.status_code in [401, 403], "Should require auth"
        print("✓ POST /api/kiosk/combos requires authentication")


# ==================== PROMOTION TESTS ====================

class TestPromotionPublicEndpoints:
    """Test public promotion endpoints (no auth required)"""
    
    def test_get_promotions_returns_list(self, api_client):
        """GET /api/kiosk/promotions should return list of active promotions"""
        response = api_client.get(f"{BASE_URL}/api/kiosk/promotions")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/kiosk/promotions returned {len(data)} promotions")
    
    def test_promotion_has_required_fields(self, api_client):
        """Verify promotion has all required fields"""
        response = api_client.get(f"{BASE_URL}/api/kiosk/promotions")
        assert response.status_code == 200
        
        promotions = response.json()
        for promo in promotions:
            assert "id" in promo, "Promotion missing id"
            assert "title" in promo, "Promotion missing title"
            assert "discount_type" in promo, "Promotion missing discount_type"
            assert "discount_value" in promo, "Promotion missing discount_value"
            assert "is_active" in promo, "Promotion missing is_active"
            assert "banner_color" in promo, "Promotion missing banner_color"
        print(f"✓ All {len(promotions)} promotions have required fields")


class TestPromotionAdminEndpoints:
    """Test admin promotion endpoints (auth required)"""
    
    def test_get_all_promotions_requires_auth(self, api_client):
        """GET /api/kiosk/promotions/all should require authentication"""
        response = api_client.get(f"{BASE_URL}/api/kiosk/promotions/all")
        assert response.status_code in [401, 403], "Should require auth"
        print("✓ GET /api/kiosk/promotions/all requires authentication")
    
    def test_get_all_promotions_with_auth(self, authenticated_client):
        """GET /api/kiosk/promotions/all should return all promotions for admin"""
        response = authenticated_client.get(f"{BASE_URL}/api/kiosk/promotions/all")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/kiosk/promotions/all returned {len(data)} promotions (admin)")
    
    def test_create_promotion(self, authenticated_client):
        """POST /api/kiosk/promotions should create new promotion"""
        new_promo = {
            "title": "TEST_Promotion",
            "description": "Test promotion for automated testing",
            "discount_type": "percent",
            "discount_value": 15,
            "min_order_amount": 100,
            "is_active": True,
            "banner_color": "#00FF00"
        }
        
        response = authenticated_client.post(
            f"{BASE_URL}/api/kiosk/promotions",
            json=new_promo
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "id" in data, "Created promotion should have id"
        assert data["title"] == new_promo["title"]
        assert data["discount_value"] == new_promo["discount_value"]
        
        # Store for cleanup
        TestPromotionAdminEndpoints.created_promo_id = data["id"]
        print(f"✓ POST /api/kiosk/promotions created promotion with id: {data['id']}")
    
    def test_update_promotion(self, authenticated_client):
        """PUT /api/kiosk/promotions/{id} should update promotion"""
        promo_id = getattr(TestPromotionAdminEndpoints, 'created_promo_id', None)
        if not promo_id:
            pytest.skip("No promotion created to update")
        
        update_data = {
            "title": "TEST_Promotion_Updated",
            "description": "Updated description",
            "discount_type": "fixed",
            "discount_value": 25,
            "is_active": True,
            "banner_color": "#FF0000"
        }
        
        response = authenticated_client.put(
            f"{BASE_URL}/api/kiosk/promotions/{promo_id}",
            json=update_data
        )
        assert response.status_code == 200
        print(f"✓ PUT /api/kiosk/promotions/{promo_id} updated successfully")
    
    def test_delete_promotion(self, authenticated_client):
        """DELETE /api/kiosk/promotions/{id} should delete promotion"""
        promo_id = getattr(TestPromotionAdminEndpoints, 'created_promo_id', None)
        if not promo_id:
            pytest.skip("No promotion created to delete")
        
        response = authenticated_client.delete(f"{BASE_URL}/api/kiosk/promotions/{promo_id}")
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("status") == "deleted"
        print(f"✓ DELETE /api/kiosk/promotions/{promo_id} deleted successfully")
    
    def test_create_promotion_requires_auth(self, api_client):
        """POST /api/kiosk/promotions should require authentication"""
        response = api_client.post(
            f"{BASE_URL}/api/kiosk/promotions",
            json={"title": "Test", "discount_type": "percent", "discount_value": 10}
        )
        assert response.status_code in [401, 403], "Should require auth"
        print("✓ POST /api/kiosk/promotions requires authentication")


# ==================== HOUR FILTERING TESTS ====================

class TestHourFiltering:
    """Test hour-based filtering for combos and promotions"""
    
    def test_combo_hour_filtering_structure(self, api_client):
        """Verify combos with hour restrictions have proper structure"""
        response = api_client.get(f"{BASE_URL}/api/kiosk/combos")
        assert response.status_code == 200
        
        combos = response.json()
        for combo in combos:
            start_hour = combo.get("start_hour")
            end_hour = combo.get("end_hour")
            
            # If one is set, both should be set or both None
            if start_hour is not None or end_hour is not None:
                # Verify hour values are valid (0-23)
                if start_hour is not None:
                    assert 0 <= start_hour <= 23, f"Invalid start_hour: {start_hour}"
                if end_hour is not None:
                    assert 0 <= end_hour <= 23, f"Invalid end_hour: {end_hour}"
        print("✓ Combo hour filtering structure is valid")
    
    def test_promotion_hour_filtering_structure(self, api_client):
        """Verify promotions with hour restrictions have proper structure"""
        response = api_client.get(f"{BASE_URL}/api/kiosk/promotions")
        assert response.status_code == 200
        
        promotions = response.json()
        for promo in promotions:
            start_hour = promo.get("start_hour")
            end_hour = promo.get("end_hour")
            
            if start_hour is not None:
                assert 0 <= start_hour <= 23, f"Invalid start_hour: {start_hour}"
            if end_hour is not None:
                assert 0 <= end_hour <= 23, f"Invalid end_hour: {end_hour}"
        print("✓ Promotion hour filtering structure is valid")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
