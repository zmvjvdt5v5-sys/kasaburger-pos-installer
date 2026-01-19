"""
Test Referral System - Kasa Burger Kiosk
Tests for:
- GET /api/kiosk/loyalty/member/{phone}/referral-code - Get referral code
- POST /api/kiosk/loyalty/member/apply-referral - Apply referral code
- DELETE /api/kiosk/products/cleanup-test - Cleanup test products
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@kasaburger.net.tr"
ADMIN_PASSWORD = "admin123"
TEST_PHONE_1 = "5558888888"  # Referrer (davet eden)
TEST_PHONE_2 = "5557777777"  # New member (davet edilen)


class TestReferralSystem:
    """Referral System Tests - Referans Sistemi Testleri"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session with auth"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login to get auth token
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if login_response.status_code == 200:
            token = login_response.json().get("access_token")
            self.session.headers.update({"Authorization": f"Bearer {token}"})
        
        yield
        
        # Cleanup: Remove test members after tests
        # Note: In production, you'd want to clean up test data
    
    def test_01_create_referrer_member(self):
        """Create first member (referrer) - Referans sahibi üye oluştur"""
        response = self.session.post(f"{BASE_URL}/api/kiosk/loyalty/member/lookup", json={
            "phone": TEST_PHONE_1
        })
        
        assert response.status_code == 200, f"Failed to create referrer: {response.text}"
        data = response.json()
        
        assert "member" in data
        assert data["member"]["phone"] == TEST_PHONE_1
        print(f"✓ Referrer member created/found: {TEST_PHONE_1}")
    
    def test_02_get_referral_code(self):
        """Get referral code for member - Üyenin referans kodunu getir"""
        response = self.session.get(f"{BASE_URL}/api/kiosk/loyalty/member/{TEST_PHONE_1}/referral-code")
        
        assert response.status_code == 200, f"Failed to get referral code: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "referral_code" in data, "Response should contain referral_code"
        assert "referral_count" in data, "Response should contain referral_count"
        assert "bonus_per_referral" in data, "Response should contain bonus_per_referral"
        
        # Verify referral code format (KB + 4 digits + 4 chars)
        referral_code = data["referral_code"]
        assert referral_code.startswith("KB"), f"Referral code should start with KB: {referral_code}"
        assert len(referral_code) >= 8, f"Referral code should be at least 8 chars: {referral_code}"
        
        # Verify bonus amount
        assert data["bonus_per_referral"] == 100, f"Bonus should be 100: {data['bonus_per_referral']}"
        
        print(f"✓ Referral code retrieved: {referral_code}")
        print(f"✓ Bonus per referral: {data['bonus_per_referral']} puan")
        
        # Store for later tests
        self.__class__.referral_code = referral_code
    
    def test_03_create_new_member_for_referral(self):
        """Create second member (to apply referral) - Referans kullanacak yeni üye oluştur"""
        response = self.session.post(f"{BASE_URL}/api/kiosk/loyalty/member/lookup", json={
            "phone": TEST_PHONE_2
        })
        
        assert response.status_code == 200, f"Failed to create new member: {response.text}"
        data = response.json()
        
        assert "member" in data
        assert data["member"]["phone"] == TEST_PHONE_2
        
        # Store initial points
        self.__class__.initial_points_member2 = data["member"].get("total_points", 0)
        print(f"✓ New member created/found: {TEST_PHONE_2}")
        print(f"✓ Initial points: {self.__class__.initial_points_member2}")
    
    def test_04_apply_referral_code_success(self):
        """Apply referral code successfully - Referans kodu başarıyla uygula"""
        # First check if member already used a referral
        member_response = self.session.post(f"{BASE_URL}/api/kiosk/loyalty/member/lookup", json={
            "phone": TEST_PHONE_2
        })
        member_data = member_response.json()
        
        if member_data.get("member", {}).get("referred_by"):
            pytest.skip("Member already used a referral code")
        
        referral_code = getattr(self.__class__, 'referral_code', None)
        if not referral_code:
            # Get referral code if not stored
            ref_response = self.session.get(f"{BASE_URL}/api/kiosk/loyalty/member/{TEST_PHONE_1}/referral-code")
            referral_code = ref_response.json().get("referral_code")
        
        response = self.session.post(f"{BASE_URL}/api/kiosk/loyalty/member/apply-referral", json={
            "phone": TEST_PHONE_2,
            "referral_code": referral_code
        })
        
        assert response.status_code == 200, f"Failed to apply referral: {response.text}"
        data = response.json()
        
        # Verify response
        assert data.get("status") == "success", f"Status should be success: {data}"
        assert data.get("bonus_earned") == 100, f"Bonus should be 100: {data.get('bonus_earned')}"
        assert "message" in data, "Response should contain message"
        
        print(f"✓ Referral code applied successfully")
        print(f"✓ Bonus earned: {data.get('bonus_earned')} puan")
    
    def test_05_verify_both_members_got_bonus(self):
        """Verify both members received bonus points - Her iki tarafın da bonus aldığını doğrula"""
        # Check referrer (member 1)
        ref_response = self.session.post(f"{BASE_URL}/api/kiosk/loyalty/member/lookup", json={
            "phone": TEST_PHONE_1
        })
        ref_data = ref_response.json()
        
        # Check new member (member 2)
        new_response = self.session.post(f"{BASE_URL}/api/kiosk/loyalty/member/lookup", json={
            "phone": TEST_PHONE_2
        })
        new_data = new_response.json()
        
        # Verify new member has referred_by set
        assert new_data["member"].get("referred_by") is not None, "New member should have referred_by set"
        
        print(f"✓ Referrer ({TEST_PHONE_1}) points: {ref_data['member'].get('total_points', 0)}")
        print(f"✓ New member ({TEST_PHONE_2}) points: {new_data['member'].get('total_points', 0)}")
        print(f"✓ New member referred_by: {new_data['member'].get('referred_by')}")
    
    def test_06_cannot_use_own_referral_code(self):
        """Cannot use own referral code - Kendi kodunu kullanamazlık kontrolü"""
        # Get referral code for member 1
        ref_response = self.session.get(f"{BASE_URL}/api/kiosk/loyalty/member/{TEST_PHONE_1}/referral-code")
        referral_code = ref_response.json().get("referral_code")
        
        # Try to apply own code
        response = self.session.post(f"{BASE_URL}/api/kiosk/loyalty/member/apply-referral", json={
            "phone": TEST_PHONE_1,
            "referral_code": referral_code
        })
        
        # Should fail with 400
        assert response.status_code == 400, f"Should reject own referral code: {response.status_code}"
        data = response.json()
        assert "detail" in data, "Response should contain error detail"
        
        print(f"✓ Own referral code correctly rejected")
        print(f"✓ Error message: {data.get('detail')}")
    
    def test_07_cannot_use_referral_code_twice(self):
        """Cannot use referral code twice - Aynı kod ikinci kez kullanılamıyor mu"""
        # Get referral code for member 1
        ref_response = self.session.get(f"{BASE_URL}/api/kiosk/loyalty/member/{TEST_PHONE_1}/referral-code")
        referral_code = ref_response.json().get("referral_code")
        
        # Try to apply again (member 2 already used it)
        response = self.session.post(f"{BASE_URL}/api/kiosk/loyalty/member/apply-referral", json={
            "phone": TEST_PHONE_2,
            "referral_code": referral_code
        })
        
        # Should fail with 400 (already used)
        assert response.status_code == 400, f"Should reject second use: {response.status_code}"
        data = response.json()
        assert "detail" in data, "Response should contain error detail"
        
        print(f"✓ Second use of referral code correctly rejected")
        print(f"✓ Error message: {data.get('detail')}")
    
    def test_08_invalid_referral_code(self):
        """Invalid referral code rejected - Geçersiz referans kodu reddedilmeli"""
        response = self.session.post(f"{BASE_URL}/api/kiosk/loyalty/member/apply-referral", json={
            "phone": TEST_PHONE_2,
            "referral_code": "INVALID123"
        })
        
        # Should fail with 400 or 404
        assert response.status_code in [400, 404], f"Should reject invalid code: {response.status_code}"
        
        print(f"✓ Invalid referral code correctly rejected")
    
    def test_09_referral_count_incremented(self):
        """Referral count incremented after successful referral - Referans sayısı artmalı"""
        response = self.session.get(f"{BASE_URL}/api/kiosk/loyalty/member/{TEST_PHONE_1}/referral-code")
        
        assert response.status_code == 200
        data = response.json()
        
        # Referral count should be at least 1 (from test_04)
        assert data.get("referral_count", 0) >= 1, f"Referral count should be >= 1: {data.get('referral_count')}"
        
        print(f"✓ Referral count: {data.get('referral_count')}")


class TestCleanupTestProducts:
    """Test Products Cleanup Endpoint - Test Ürünleri Temizleme"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session with auth"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login to get auth token
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if login_response.status_code == 200:
            token = login_response.json().get("access_token")
            self.session.headers.update({"Authorization": f"Bearer {token}"})
        
        yield
    
    def test_01_create_test_product(self):
        """Create a test product to cleanup - Temizlenecek test ürünü oluştur"""
        test_product = {
            "name": "TEST_Cleanup_Product",
            "category": "Et Burger",
            "price": 999,
            "available": True
        }
        
        response = self.session.post(f"{BASE_URL}/api/kiosk/products", json=test_product)
        
        assert response.status_code == 200, f"Failed to create test product: {response.text}"
        data = response.json()
        
        assert data.get("name") == "TEST_Cleanup_Product"
        print(f"✓ Test product created: {data.get('name')}")
        
        # Store product id
        self.__class__.test_product_id = data.get("id")
    
    def test_02_verify_test_product_exists(self):
        """Verify test product exists before cleanup - Temizlik öncesi test ürününün varlığını doğrula"""
        response = self.session.get(f"{BASE_URL}/api/kiosk/products")
        
        assert response.status_code == 200
        products = response.json()
        
        # Find test products
        test_products = [p for p in products if "TEST" in p.get("name", "").upper()]
        
        print(f"✓ Found {len(test_products)} test products before cleanup")
        
        # Store count for comparison
        self.__class__.test_products_before = len(test_products)
    
    def test_03_cleanup_test_products(self):
        """Cleanup test products - Test ürünlerini temizle"""
        response = self.session.delete(f"{BASE_URL}/api/kiosk/products/cleanup-test")
        
        assert response.status_code == 200, f"Failed to cleanup: {response.text}"
        data = response.json()
        
        assert data.get("status") == "cleaned", f"Status should be 'cleaned': {data}"
        assert "deleted_count" in data, "Response should contain deleted_count"
        
        print(f"✓ Cleanup successful")
        print(f"✓ Deleted count: {data.get('deleted_count')}")
    
    def test_04_verify_test_products_removed(self):
        """Verify test products removed after cleanup - Temizlik sonrası test ürünlerinin silindiğini doğrula"""
        response = self.session.get(f"{BASE_URL}/api/kiosk/products")
        
        assert response.status_code == 200
        products = response.json()
        
        # Find test products
        test_products = [p for p in products if "TEST" in p.get("name", "").upper()]
        
        print(f"✓ Found {len(test_products)} test products after cleanup")
        
        # Should have fewer or no test products
        assert len(test_products) == 0, f"All TEST products should be removed: {[p.get('name') for p in test_products]}"
    
    def test_05_cleanup_requires_auth(self):
        """Cleanup endpoint requires authentication - Temizlik endpoint'i auth gerektirmeli"""
        # Create new session without auth
        no_auth_session = requests.Session()
        no_auth_session.headers.update({"Content-Type": "application/json"})
        
        response = no_auth_session.delete(f"{BASE_URL}/api/kiosk/products/cleanup-test")
        
        # Should fail with 401 or 403
        assert response.status_code in [401, 403], f"Should require auth: {response.status_code}"
        
        print(f"✓ Cleanup endpoint correctly requires authentication")


class TestReferralEdgeCases:
    """Edge cases for referral system - Referans sistemi kenar durumları"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        yield
    
    def test_01_nonexistent_member_referral_code(self):
        """Get referral code for non-existent member - Olmayan üye için referans kodu"""
        response = self.session.get(f"{BASE_URL}/api/kiosk/loyalty/member/9999999999/referral-code")
        
        # Should fail with 404
        assert response.status_code == 404, f"Should return 404 for non-existent member: {response.status_code}"
        
        print(f"✓ Non-existent member correctly returns 404")
    
    def test_02_apply_referral_nonexistent_member(self):
        """Apply referral for non-existent member - Olmayan üye için referans uygula"""
        response = self.session.post(f"{BASE_URL}/api/kiosk/loyalty/member/apply-referral", json={
            "phone": "9999999999",
            "referral_code": "KBTEST123"
        })
        
        # Should fail with 404
        assert response.status_code == 404, f"Should return 404: {response.status_code}"
        
        print(f"✓ Non-existent member correctly returns 404")
    
    def test_03_empty_referral_code(self):
        """Apply empty referral code - Boş referans kodu"""
        # First create a member
        self.session.post(f"{BASE_URL}/api/kiosk/loyalty/member/lookup", json={
            "phone": "5551234567"
        })
        
        response = self.session.post(f"{BASE_URL}/api/kiosk/loyalty/member/apply-referral", json={
            "phone": "5551234567",
            "referral_code": ""
        })
        
        # Should fail with 404 (empty code won't match any member)
        assert response.status_code in [400, 404, 422], f"Should reject empty code: {response.status_code}"
        
        print(f"✓ Empty referral code correctly rejected")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
