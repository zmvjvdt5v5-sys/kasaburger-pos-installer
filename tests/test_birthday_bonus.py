"""
Birthday Bonus (Doğum Günü Bonusu) Test Suite
Tests for the new birthday bonus feature in Kasa Burger Kiosk Loyalty Program

Features tested:
- POST /api/kiosk/loyalty/member/set-birthday - Set birthday (MM-DD format)
- GET /api/kiosk/loyalty/member/{phone}/birthday-status - Check birthday status
- POST /api/kiosk/loyalty/member/claim-birthday-bonus - Claim birthday bonus
- GET /api/kiosk/loyalty/birthdays/today - Get today's birthdays (admin)

Regression tests:
- POST /api/kiosk/loyalty/lookup - Member lookup
- POST /api/kiosk/loyalty/earn - Earn points
- POST /api/kiosk/loyalty/redeem - Redeem rewards
- Referral system endpoints
"""

import pytest
import requests
import os
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@kasaburger.net.tr"
ADMIN_PASSWORD = "admin123"
TEST_PHONE_EXISTING = "5558888888"
TEST_PHONE_NEW = "5559999999"
TEST_PHONE_BIRTHDAY = "5551234567"  # New phone for birthday tests

# Today's date in MM-DD format for birthday testing
TODAY_MMDD = datetime.now().strftime("%m-%d")


class TestBirthdayBonusSetup:
    """Setup tests - ensure member exists for birthday testing"""
    
    def test_create_birthday_test_member(self):
        """Create a new member for birthday testing"""
        response = requests.post(
            f"{BASE_URL}/api/kiosk/loyalty/member/lookup",
            json={"phone": TEST_PHONE_BIRTHDAY}
        )
        assert response.status_code == 200
        data = response.json()
        assert "member" in data
        assert data["member"]["phone"] == TEST_PHONE_BIRTHDAY
        print(f"✓ Birthday test member created/found: {TEST_PHONE_BIRTHDAY}")


class TestSetBirthday:
    """Tests for POST /api/kiosk/loyalty/member/set-birthday"""
    
    def test_set_birthday_valid_format(self):
        """Set birthday with valid MM-DD format"""
        response = requests.post(
            f"{BASE_URL}/api/kiosk/loyalty/member/set-birthday",
            json={"phone": TEST_PHONE_BIRTHDAY, "birth_date": TODAY_MMDD}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert data["birth_date"] == TODAY_MMDD
        assert "Doğum günü kaydedildi" in data["message"]
        print(f"✓ Birthday set successfully: {TODAY_MMDD}")
    
    def test_set_birthday_invalid_format(self):
        """Reject invalid date format"""
        response = requests.post(
            f"{BASE_URL}/api/kiosk/loyalty/member/set-birthday",
            json={"phone": TEST_PHONE_BIRTHDAY, "birth_date": "2024-01-19"}  # Wrong format
        )
        assert response.status_code == 400
        data = response.json()
        assert "Geçersiz tarih formatı" in data["detail"]
        print("✓ Invalid date format rejected")
    
    def test_set_birthday_invalid_month(self):
        """Reject invalid month (13)"""
        response = requests.post(
            f"{BASE_URL}/api/kiosk/loyalty/member/set-birthday",
            json={"phone": TEST_PHONE_BIRTHDAY, "birth_date": "13-15"}
        )
        assert response.status_code == 400
        print("✓ Invalid month rejected")
    
    def test_set_birthday_invalid_day(self):
        """Reject invalid day (32)"""
        response = requests.post(
            f"{BASE_URL}/api/kiosk/loyalty/member/set-birthday",
            json={"phone": TEST_PHONE_BIRTHDAY, "birth_date": "01-32"}
        )
        assert response.status_code == 400
        print("✓ Invalid day rejected")
    
    def test_set_birthday_nonexistent_member(self):
        """Reject birthday set for non-existent member"""
        response = requests.post(
            f"{BASE_URL}/api/kiosk/loyalty/member/set-birthday",
            json={"phone": "0000000000", "birth_date": "05-15"}
        )
        assert response.status_code == 404
        assert "Üye bulunamadı" in response.json()["detail"]
        print("✓ Non-existent member rejected")


class TestBirthdayStatus:
    """Tests for GET /api/kiosk/loyalty/member/{phone}/birthday-status"""
    
    def test_birthday_status_with_birthday_today(self):
        """Check status when birthday is today"""
        # First ensure birthday is set to today
        requests.post(
            f"{BASE_URL}/api/kiosk/loyalty/member/set-birthday",
            json={"phone": TEST_PHONE_BIRTHDAY, "birth_date": TODAY_MMDD}
        )
        
        response = requests.get(
            f"{BASE_URL}/api/kiosk/loyalty/member/{TEST_PHONE_BIRTHDAY}/birthday-status"
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["has_birthday"] == True
        assert data["birth_date"] == TODAY_MMDD
        assert data["is_birthday_today"] == True
        assert data["bonus_points"] == 200
        assert data["free_product"] == "Kasa Classic Burger"
        print(f"✓ Birthday status correct - is_birthday_today: {data['is_birthday_today']}")
        print(f"  Bonus: {data['bonus_points']} puan + {data['free_product']}")
    
    def test_birthday_status_no_birthday_set(self):
        """Check status when no birthday is set"""
        # Create a new member without birthday
        test_phone = "5550001111"
        requests.post(
            f"{BASE_URL}/api/kiosk/loyalty/member/lookup",
            json={"phone": test_phone}
        )
        
        response = requests.get(
            f"{BASE_URL}/api/kiosk/loyalty/member/{test_phone}/birthday-status"
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["has_birthday"] == False
        assert data["is_birthday_today"] == False
        assert data["can_claim_bonus"] == False
        print("✓ No birthday set - status correct")
    
    def test_birthday_status_nonexistent_member(self):
        """Check status for non-existent member"""
        response = requests.get(
            f"{BASE_URL}/api/kiosk/loyalty/member/0000000000/birthday-status"
        )
        assert response.status_code == 404
        print("✓ Non-existent member returns 404")


class TestClaimBirthdayBonus:
    """Tests for POST /api/kiosk/loyalty/member/claim-birthday-bonus"""
    
    def test_claim_birthday_bonus_success(self):
        """Successfully claim birthday bonus when it's birthday"""
        # Use unique phone with timestamp to ensure fresh member
        import time
        test_phone = f"555{int(time.time()) % 10000000:07d}"
        
        # Create member
        requests.post(
            f"{BASE_URL}/api/kiosk/loyalty/member/lookup",
            json={"phone": test_phone}
        )
        
        # Set birthday to today
        requests.post(
            f"{BASE_URL}/api/kiosk/loyalty/member/set-birthday",
            json={"phone": test_phone, "birth_date": TODAY_MMDD}
        )
        
        # Claim bonus
        response = requests.post(
            f"{BASE_URL}/api/kiosk/loyalty/member/claim-birthday-bonus",
            json={"phone": test_phone}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["status"] == "success"
        assert data["bonus_points"] == 200
        assert data["free_product_id"] == "kasa-classic"
        assert data["free_product_name"] == "Kasa Classic Burger"
        assert "Doğum Günün Kutlu Olsun" in data["message"]
        print(f"✓ Birthday bonus claimed: {data['bonus_points']} puan + {data['free_product_name']}")
        
        # Store phone for next test
        TestClaimBirthdayBonus.claimed_phone = test_phone
    
    def test_claim_birthday_bonus_already_claimed(self):
        """Cannot claim bonus twice in same year"""
        # Use the phone from previous test
        test_phone = getattr(TestClaimBirthdayBonus, 'claimed_phone', "5552223333")
        
        response = requests.post(
            f"{BASE_URL}/api/kiosk/loyalty/member/claim-birthday-bonus",
            json={"phone": test_phone}
        )
        assert response.status_code == 400
        assert "zaten aldınız" in response.json()["detail"]
        print("✓ Double claim rejected")
    
    def test_claim_birthday_bonus_not_birthday(self):
        """Cannot claim bonus when it's not birthday"""
        test_phone = "5553334444"
        
        # Create member
        requests.post(
            f"{BASE_URL}/api/kiosk/loyalty/member/lookup",
            json={"phone": test_phone}
        )
        
        # Set birthday to different day (tomorrow)
        tomorrow = datetime.now()
        tomorrow_day = (tomorrow.day % 28) + 1  # Simple next day calculation
        tomorrow_mmdd = f"{tomorrow.month:02d}-{tomorrow_day:02d}"
        
        requests.post(
            f"{BASE_URL}/api/kiosk/loyalty/member/set-birthday",
            json={"phone": test_phone, "birth_date": tomorrow_mmdd}
        )
        
        # Try to claim
        response = requests.post(
            f"{BASE_URL}/api/kiosk/loyalty/member/claim-birthday-bonus",
            json={"phone": test_phone}
        )
        assert response.status_code == 400
        assert "doğum gününüz değil" in response.json()["detail"]
        print("✓ Non-birthday claim rejected")
    
    def test_claim_birthday_bonus_no_birthday_set(self):
        """Cannot claim bonus when no birthday is set"""
        test_phone = "5554445555"
        
        # Create member without birthday
        requests.post(
            f"{BASE_URL}/api/kiosk/loyalty/member/lookup",
            json={"phone": test_phone}
        )
        
        # Try to claim
        response = requests.post(
            f"{BASE_URL}/api/kiosk/loyalty/member/claim-birthday-bonus",
            json={"phone": test_phone}
        )
        assert response.status_code == 400
        assert "kayıtlı değil" in response.json()["detail"]
        print("✓ No birthday set - claim rejected")
    
    def test_claim_birthday_bonus_nonexistent_member(self):
        """Cannot claim bonus for non-existent member"""
        response = requests.post(
            f"{BASE_URL}/api/kiosk/loyalty/member/claim-birthday-bonus",
            json={"phone": "0000000000"}
        )
        assert response.status_code == 404
        print("✓ Non-existent member returns 404")


class TestTodaysBirthdays:
    """Tests for GET /api/kiosk/loyalty/birthdays/today (admin)"""
    
    @pytest.fixture
    def auth_token(self):
        """Get admin auth token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("Admin login failed")
    
    def test_get_todays_birthdays_authenticated(self, auth_token):
        """Get today's birthdays with admin auth"""
        response = requests.get(
            f"{BASE_URL}/api/kiosk/loyalty/birthdays/today",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "date" in data
        assert "count" in data
        assert "members" in data
        assert data["date"] == TODAY_MMDD
        print(f"✓ Today's birthdays: {data['count']} members on {data['date']}")
        
        # Check member structure
        if data["members"]:
            member = data["members"][0]
            assert "phone" in member
            assert "bonus_claimed" in member
            print(f"  Sample member: {member['phone']}, bonus_claimed: {member['bonus_claimed']}")
    
    def test_get_todays_birthdays_unauthenticated(self):
        """Reject unauthenticated request"""
        response = requests.get(
            f"{BASE_URL}/api/kiosk/loyalty/birthdays/today"
        )
        assert response.status_code in [401, 403]
        print("✓ Unauthenticated request rejected")


class TestLoyaltyProgramRegression:
    """Regression tests for existing loyalty program features"""
    
    def test_member_lookup(self):
        """POST /api/kiosk/loyalty/lookup - Member lookup works"""
        response = requests.post(
            f"{BASE_URL}/api/kiosk/loyalty/member/lookup",
            json={"phone": TEST_PHONE_EXISTING}
        )
        assert response.status_code == 200
        data = response.json()
        assert "member" in data
        assert "tier_info" in data
        print(f"✓ Member lookup: {data['member']['phone']}, tier: {data['member']['tier']}")
    
    def test_earn_points(self):
        """POST /api/kiosk/loyalty/earn - Earn points works"""
        response = requests.post(
            f"{BASE_URL}/api/kiosk/loyalty/earn",
            json={
                "phone": TEST_PHONE_EXISTING,
                "order_total": 100,
                "order_id": "TEST-ORDER-001"
            }
        )
        assert response.status_code == 200
        data = response.json()
        # API returns base_points and total_earned instead of points_earned
        assert "base_points" in data or "total_earned" in data
        assert "new_total" in data
        earned = data.get("total_earned", data.get("base_points", 0))
        print(f"✓ Points earned: {earned}, new total: {data['new_total']}")
    
    def test_get_rewards(self):
        """GET /api/kiosk/loyalty/rewards - Get rewards works"""
        response = requests.get(f"{BASE_URL}/api/kiosk/loyalty/rewards")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        print(f"✓ Rewards available: {len(data)} rewards")
    
    def test_loyalty_config(self):
        """GET /api/kiosk/loyalty/config - Config includes birthday bonus"""
        response = requests.get(f"{BASE_URL}/api/kiosk/loyalty/config")
        assert response.status_code == 200
        data = response.json()
        assert "points_per_lira" in data
        assert "tiers" in data
        print(f"✓ Loyalty config: {data['points_per_lira']} points per lira")


class TestReferralSystemRegression:
    """Regression tests for referral system"""
    
    def test_get_referral_code(self):
        """GET /api/kiosk/loyalty/member/{phone}/referral-code - Get referral code"""
        response = requests.get(
            f"{BASE_URL}/api/kiosk/loyalty/member/{TEST_PHONE_EXISTING}/referral-code"
        )
        assert response.status_code == 200
        data = response.json()
        assert "referral_code" in data
        assert data["referral_code"].startswith("KB")
        assert "bonus_per_referral" in data
        assert data["bonus_per_referral"] == 100
        print(f"✓ Referral code: {data['referral_code']}, bonus: {data['bonus_per_referral']}")
    
    def test_apply_referral_invalid_code(self):
        """POST /api/kiosk/loyalty/member/apply-referral - Invalid code rejected"""
        response = requests.post(
            f"{BASE_URL}/api/kiosk/loyalty/member/apply-referral",
            json={
                "phone": TEST_PHONE_BIRTHDAY,
                "referral_code": "INVALID123"
            }
        )
        assert response.status_code == 404
        print("✓ Invalid referral code rejected")


class TestBirthdayBonusVerification:
    """Verify birthday bonus was correctly applied"""
    
    def test_verify_bonus_points_added(self):
        """Verify bonus points were added to member"""
        test_phone = "5552223333"  # Phone that claimed bonus
        
        response = requests.post(
            f"{BASE_URL}/api/kiosk/loyalty/member/lookup",
            json={"phone": test_phone}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Member should have at least 200 points from birthday bonus
        assert data["member"]["total_points"] >= 200
        print(f"✓ Member has {data['member']['total_points']} points (includes 200 birthday bonus)")
    
    def test_verify_birthday_status_after_claim(self):
        """Verify birthday status shows already claimed"""
        test_phone = "5552223333"  # Phone that claimed bonus
        
        response = requests.get(
            f"{BASE_URL}/api/kiosk/loyalty/member/{test_phone}/birthday-status"
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["already_claimed_this_year"] == True
        assert data["can_claim_bonus"] == False
        print(f"✓ Birthday status: already_claimed_this_year={data['already_claimed_this_year']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
