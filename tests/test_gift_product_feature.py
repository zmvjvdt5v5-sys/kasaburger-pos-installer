"""
Test Gift Product Feature for Kiosk Combos
Tests: gift_product_id, gift_product_name, gift_message fields in combos
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://pos-kasa.preview.emergentagent.com')

class TestGiftProductFeature:
    """Test gift product fields in combo menus"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session with auth"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login to get token
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@kasaburger.net.tr",
            "password": "admin123"
        })
        if login_response.status_code == 200:
            token = login_response.json().get("access_token")
            self.session.headers.update({"Authorization": f"Bearer {token}"})
        
        yield
        self.session.close()
    
    # ==================== GET COMBOS TESTS ====================
    
    def test_get_combos_returns_gift_fields(self):
        """Test that GET /api/kiosk/combos returns combos with gift fields"""
        response = self.session.get(f"{BASE_URL}/api/kiosk/combos")
        assert response.status_code == 200
        
        combos = response.json()
        assert len(combos) > 0, "Should have at least one combo"
        
        # Find combos with gift products
        combos_with_gifts = [c for c in combos if c.get("gift_product_id")]
        print(f"Found {len(combos_with_gifts)} combos with gift products")
        
        for combo in combos_with_gifts:
            print(f"  - {combo['name']}: gift={combo.get('gift_product_name')}")
    
    def test_premium_menu_has_mozarella_sticks_gift(self):
        """Test Premium Menü has Mozarella Sticks as gift"""
        response = self.session.get(f"{BASE_URL}/api/kiosk/combos")
        assert response.status_code == 200
        
        combos = response.json()
        premium_menu = next((c for c in combos if c.get("id") == "premium-menu"), None)
        
        assert premium_menu is not None, "Premium Menü should exist"
        assert premium_menu.get("gift_product_id") == "mozarella-sticks", "Gift product should be mozarella-sticks"
        assert premium_menu.get("gift_product_name") == "Mozarella Sticks", "Gift product name should be Mozarella Sticks"
        assert "Mozzarella" in premium_menu.get("gift_message", ""), "Gift message should mention Mozzarella"
        print(f"✓ Premium Menü gift: {premium_menu.get('gift_product_name')} - {premium_menu.get('gift_message')}")
    
    def test_double_xl_menu_has_mac_cheese_gift(self):
        """Test Double XL Menü has Mac & Cheese as gift"""
        response = self.session.get(f"{BASE_URL}/api/kiosk/combos")
        assert response.status_code == 200
        
        combos = response.json()
        double_menu = next((c for c in combos if c.get("id") == "double-menu"), None)
        
        # Note: Double XL Menü has time restriction (11:00-15:00), may not appear
        if double_menu is None:
            # Check in all combos (admin endpoint)
            all_response = self.session.get(f"{BASE_URL}/api/kiosk/combos/all")
            if all_response.status_code == 200:
                all_combos = all_response.json()
                double_menu = next((c for c in all_combos if c.get("id") == "double-menu"), None)
        
        if double_menu:
            assert double_menu.get("gift_product_id") == "mac-cheese", "Gift product should be mac-cheese"
            assert "Mac" in double_menu.get("gift_product_name", ""), "Gift product name should contain Mac"
            print(f"✓ Double XL Menü gift: {double_menu.get('gift_product_name')} - {double_menu.get('gift_message')}")
        else:
            print("⚠ Double XL Menü not visible (time restriction 11:00-15:00)")
    
    def test_combo_without_gift_has_null_fields(self):
        """Test combos without gift have null gift fields"""
        response = self.session.get(f"{BASE_URL}/api/kiosk/combos")
        assert response.status_code == 200
        
        combos = response.json()
        klasik_menu = next((c for c in combos if c.get("id") == "klasik-menu"), None)
        
        assert klasik_menu is not None, "Klasik Menü should exist"
        # Klasik Menü should not have gift
        assert klasik_menu.get("gift_product_id") is None, "Klasik Menü should not have gift_product_id"
        print(f"✓ Klasik Menü has no gift product (as expected)")
    
    # ==================== UPDATE COMBO WITH GIFT TESTS ====================
    
    def test_update_combo_with_gift_product(self):
        """Test PUT /api/kiosk/combos/{id} can update gift product"""
        # First get current combo data
        response = self.session.get(f"{BASE_URL}/api/kiosk/combos/all")
        assert response.status_code == 200
        
        combos = response.json()
        tavuk_menu = next((c for c in combos if c.get("id") == "tavuk-menu"), None)
        assert tavuk_menu is not None, "Tavuk Menü should exist"
        
        # Update with gift product
        update_data = {
            "name": tavuk_menu["name"],
            "description": tavuk_menu.get("description", ""),
            "products": tavuk_menu["products"],
            "original_price": tavuk_menu["original_price"],
            "combo_price": tavuk_menu["combo_price"],
            "discount_percent": tavuk_menu.get("discount_percent", 0),
            "image": tavuk_menu.get("image", ""),
            "is_active": True,
            "gift_product_id": "churros",
            "gift_product_name": "Churros",
            "gift_message": "🎁 TEST Churros Hediye!"
        }
        
        update_response = self.session.put(f"{BASE_URL}/api/kiosk/combos/tavuk-menu", json=update_data)
        assert update_response.status_code == 200, f"Update failed: {update_response.text}"
        print(f"✓ Updated Tavuk Menü with gift: Churros")
        
        # Verify update
        verify_response = self.session.get(f"{BASE_URL}/api/kiosk/combos/all")
        assert verify_response.status_code == 200
        
        updated_combos = verify_response.json()
        updated_tavuk = next((c for c in updated_combos if c.get("id") == "tavuk-menu"), None)
        
        assert updated_tavuk.get("gift_product_id") == "churros", "Gift product should be updated to churros"
        assert updated_tavuk.get("gift_product_name") == "Churros", "Gift product name should be Churros"
        assert "TEST" in updated_tavuk.get("gift_message", ""), "Gift message should contain TEST"
        print(f"✓ Verified gift update: {updated_tavuk.get('gift_product_name')}")
        
        # Cleanup - remove gift
        cleanup_data = {**update_data, "gift_product_id": None, "gift_product_name": "", "gift_message": ""}
        self.session.put(f"{BASE_URL}/api/kiosk/combos/tavuk-menu", json=cleanup_data)
        print(f"✓ Cleaned up test gift from Tavuk Menü")
    
    def test_update_combo_remove_gift_product(self):
        """Test removing gift product from combo"""
        # Get Premium Menü
        response = self.session.get(f"{BASE_URL}/api/kiosk/combos/all")
        assert response.status_code == 200
        
        combos = response.json()
        premium_menu = next((c for c in combos if c.get("id") == "premium-menu"), None)
        assert premium_menu is not None
        
        original_gift = premium_menu.get("gift_product_id")
        original_gift_name = premium_menu.get("gift_product_name")
        original_gift_message = premium_menu.get("gift_message")
        
        # Remove gift
        update_data = {
            "name": premium_menu["name"],
            "description": premium_menu.get("description", ""),
            "products": premium_menu["products"],
            "original_price": premium_menu["original_price"],
            "combo_price": premium_menu["combo_price"],
            "discount_percent": premium_menu.get("discount_percent", 0),
            "image": premium_menu.get("image", ""),
            "is_active": True,
            "gift_product_id": None,
            "gift_product_name": "",
            "gift_message": ""
        }
        
        update_response = self.session.put(f"{BASE_URL}/api/kiosk/combos/premium-menu", json=update_data)
        assert update_response.status_code == 200
        print(f"✓ Removed gift from Premium Menü")
        
        # Verify removal
        verify_response = self.session.get(f"{BASE_URL}/api/kiosk/combos/all")
        updated_combos = verify_response.json()
        updated_premium = next((c for c in updated_combos if c.get("id") == "premium-menu"), None)
        
        assert updated_premium.get("gift_product_id") is None or updated_premium.get("gift_product_id") == "", "Gift should be removed"
        print(f"✓ Verified gift removal")
        
        # Restore original gift
        restore_data = {**update_data, "gift_product_id": original_gift, "gift_product_name": original_gift_name, "gift_message": original_gift_message}
        self.session.put(f"{BASE_URL}/api/kiosk/combos/premium-menu", json=restore_data)
        print(f"✓ Restored original gift: {original_gift_name}")
    
    # ==================== CREATE COMBO WITH GIFT TESTS ====================
    
    def test_create_combo_with_gift_product(self):
        """Test POST /api/kiosk/combos can create combo with gift"""
        new_combo = {
            "name": "TEST_Gift_Combo",
            "description": "Test combo with gift product",
            "products": ["kasa-classic", "cheese-fries"],
            "original_price": 610,
            "combo_price": 500,
            "discount_percent": 18,
            "is_active": True,
            "gift_product_id": "ayran",
            "gift_product_name": "Ayran",
            "gift_message": "🎁 Ayran Hediye!"
        }
        
        create_response = self.session.post(f"{BASE_URL}/api/kiosk/combos", json=new_combo)
        assert create_response.status_code == 200, f"Create failed: {create_response.text}"
        
        created = create_response.json()
        combo_id = created.get("id")
        assert combo_id is not None, "Created combo should have ID"
        assert created.get("gift_product_id") == "ayran", "Gift product should be ayran"
        assert created.get("gift_product_name") == "Ayran", "Gift product name should be Ayran"
        print(f"✓ Created combo with gift: {created.get('name')} (ID: {combo_id})")
        
        # Cleanup
        delete_response = self.session.delete(f"{BASE_URL}/api/kiosk/combos/{combo_id}")
        assert delete_response.status_code == 200
        print(f"✓ Cleaned up test combo")
    
    # ==================== GIFT MESSAGE CUSTOMIZATION TESTS ====================
    
    def test_gift_message_customization(self):
        """Test that gift message can be customized"""
        response = self.session.get(f"{BASE_URL}/api/kiosk/combos/all")
        assert response.status_code == 200
        
        combos = response.json()
        premium_menu = next((c for c in combos if c.get("id") == "premium-menu"), None)
        
        if premium_menu and premium_menu.get("gift_message"):
            # Update with custom message
            update_data = {
                "name": premium_menu["name"],
                "description": premium_menu.get("description", ""),
                "products": premium_menu["products"],
                "original_price": premium_menu["original_price"],
                "combo_price": premium_menu["combo_price"],
                "discount_percent": premium_menu.get("discount_percent", 0),
                "image": premium_menu.get("image", ""),
                "is_active": True,
                "gift_product_id": premium_menu.get("gift_product_id"),
                "gift_product_name": premium_menu.get("gift_product_name"),
                "gift_message": "🎁 ÖZEL MESAJ: Mozzarella Sticks Hediye!"
            }
            
            update_response = self.session.put(f"{BASE_URL}/api/kiosk/combos/premium-menu", json=update_data)
            assert update_response.status_code == 200
            
            # Verify
            verify_response = self.session.get(f"{BASE_URL}/api/kiosk/combos/all")
            updated_combos = verify_response.json()
            updated_premium = next((c for c in updated_combos if c.get("id") == "premium-menu"), None)
            
            assert "ÖZEL MESAJ" in updated_premium.get("gift_message", ""), "Custom message should be saved"
            print(f"✓ Gift message customization works: {updated_premium.get('gift_message')}")
            
            # Restore original
            restore_data = {**update_data, "gift_message": "🎁 Mozzarella Sticks Hediye!"}
            self.session.put(f"{BASE_URL}/api/kiosk/combos/premium-menu", json=restore_data)
            print(f"✓ Restored original gift message")


class TestGiftProductValidation:
    """Test gift product validation and edge cases"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session with auth"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@kasaburger.net.tr",
            "password": "admin123"
        })
        if login_response.status_code == 200:
            token = login_response.json().get("access_token")
            self.session.headers.update({"Authorization": f"Bearer {token}"})
        
        yield
        self.session.close()
    
    def test_gift_product_from_allowed_categories(self):
        """Test that gift products are from Yan Ürün, Tatlı, İçecek categories"""
        # Get products to verify categories
        products_response = self.session.get(f"{BASE_URL}/api/kiosk/products")
        assert products_response.status_code == 200
        
        products = products_response.json()
        
        # Get combos with gifts
        combos_response = self.session.get(f"{BASE_URL}/api/kiosk/combos/all")
        assert combos_response.status_code == 200
        
        combos = combos_response.json()
        combos_with_gifts = [c for c in combos if c.get("gift_product_id")]
        
        allowed_categories = ["Yan Ürün", "Tatlı", "İçecek"]
        
        for combo in combos_with_gifts:
            gift_id = combo.get("gift_product_id")
            gift_product = next((p for p in products if p.get("id") == gift_id), None)
            
            if gift_product:
                category = gift_product.get("category")
                assert category in allowed_categories, f"Gift product {gift_id} should be from allowed categories, got: {category}"
                print(f"✓ {combo['name']} gift '{gift_product['name']}' is from category: {category}")
            else:
                print(f"⚠ Gift product {gift_id} not found in products list")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
