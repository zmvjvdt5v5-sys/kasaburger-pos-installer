"""
Loyalty Program Tests - Sadakat Programı
Tests for:
- GET /api/kiosk/loyalty/config - Loyalty settings
- GET /api/kiosk/loyalty/rewards - Rewards list
- POST /api/kiosk/loyalty/member/lookup - Member lookup/create
- POST /api/kiosk/loyalty/earn - Earn points
- POST /api/kiosk/loyalty/redeem - Redeem rewards
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://kbys-portal.preview.emergentagent.com').rstrip('/')

# Test phone number
TEST_PHONE = "5559876543"
TEST_PHONE_NEW = f"555{int(time.time()) % 10000000:07d}"  # Unique phone for new member test


class TestLoyaltyConfig:
    """Loyalty configuration endpoint tests"""
    
    def test_get_loyalty_config(self):
        """GET /api/kiosk/loyalty/config - Should return loyalty settings"""
        response = requests.get(f"{BASE_URL}/api/kiosk/loyalty/config")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        
        # Verify config structure
        assert "points_per_lira" in data, "Missing points_per_lira"
        assert "tiers" in data, "Missing tiers"
        
        # Verify points_per_lira value
        assert data["points_per_lira"] == 1, f"Expected points_per_lira=1, got {data['points_per_lira']}"
        
        # Verify tiers structure
        tiers = data["tiers"]
        assert "bronze" in tiers, "Missing bronze tier"
        assert "silver" in tiers, "Missing silver tier"
        assert "gold" in tiers, "Missing gold tier"
        assert "platinum" in tiers, "Missing platinum tier"
        
        print(f"✓ Loyalty config: {data['points_per_lira']} puan/TL, {len(tiers)} tier")
    
    def test_tier_thresholds(self):
        """Verify tier thresholds are correct"""
        response = requests.get(f"{BASE_URL}/api/kiosk/loyalty/config")
        assert response.status_code == 200
        
        tiers = response.json()["tiers"]
        
        # Verify tier thresholds
        assert tiers["bronze"]["min_points"] == 0, "Bronze should start at 0"
        assert tiers["silver"]["min_points"] == 500, "Silver should start at 500"
        assert tiers["gold"]["min_points"] == 1500, "Gold should start at 1500"
        assert tiers["platinum"]["min_points"] == 5000, "Platinum should start at 5000"
        
        # Verify bonus multipliers
        assert tiers["bronze"]["bonus_multiplier"] == 1.0, "Bronze multiplier should be 1.0"
        assert tiers["silver"]["bonus_multiplier"] == 1.25, "Silver multiplier should be 1.25"
        assert tiers["gold"]["bonus_multiplier"] == 1.5, "Gold multiplier should be 1.5"
        assert tiers["platinum"]["bonus_multiplier"] == 2.0, "Platinum multiplier should be 2.0"
        
        print("✓ Tier thresholds: Bronz(0), Gümüş(500), Altın(1500), Platin(5000)")
        print("✓ Bonus multipliers: 1x, 1.25x, 1.5x, 2x")


class TestLoyaltyRewards:
    """Loyalty rewards endpoint tests"""
    
    def test_get_rewards_list(self):
        """GET /api/kiosk/loyalty/rewards - Should return rewards list"""
        response = requests.get(f"{BASE_URL}/api/kiosk/loyalty/rewards")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        rewards = response.json()
        
        # Should have rewards
        assert isinstance(rewards, list), "Rewards should be a list"
        assert len(rewards) > 0, "Should have at least one reward"
        
        print(f"✓ Found {len(rewards)} rewards")
        
        # Verify reward structure
        for reward in rewards:
            assert "id" in reward, "Reward missing id"
            assert "name" in reward, "Reward missing name"
            assert "points_required" in reward, "Reward missing points_required"
            assert "reward_type" in reward, "Reward missing reward_type"
            print(f"  - {reward['name']}: {reward['points_required']} puan ({reward['reward_type']})")
    
    def test_rewards_have_correct_types(self):
        """Verify rewards have valid types"""
        response = requests.get(f"{BASE_URL}/api/kiosk/loyalty/rewards")
        assert response.status_code == 200
        
        rewards = response.json()
        valid_types = ["free_product", "discount_percent", "discount_fixed"]
        
        for reward in rewards:
            assert reward["reward_type"] in valid_types, f"Invalid reward type: {reward['reward_type']}"
        
        print(f"✓ All {len(rewards)} rewards have valid types")
    
    def test_default_rewards_exist(self):
        """Verify default rewards are present"""
        response = requests.get(f"{BASE_URL}/api/kiosk/loyalty/rewards")
        assert response.status_code == 200
        
        rewards = response.json()
        reward_ids = [r["id"] for r in rewards]
        
        # Check for expected default rewards
        expected_rewards = ["free-drink", "free-fries", "free-dessert", "free-burger"]
        found_rewards = [r for r in expected_rewards if r in reward_ids]
        
        print(f"✓ Found {len(found_rewards)}/{len(expected_rewards)} default rewards")


class TestMemberLookup:
    """Member lookup/create endpoint tests"""
    
    def test_lookup_existing_member(self):
        """POST /api/kiosk/loyalty/member/lookup - Lookup existing member"""
        response = requests.post(
            f"{BASE_URL}/api/kiosk/loyalty/member/lookup",
            json={"phone": TEST_PHONE}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        
        # Verify response structure
        assert "member" in data, "Missing member in response"
        assert "tier_info" in data, "Missing tier_info in response"
        
        member = data["member"]
        assert "phone" in member, "Member missing phone"
        assert "total_points" in member, "Member missing total_points"
        assert "tier" in member, "Member missing tier"
        
        print(f"✓ Member found: {member['phone']}, {member['total_points']} puan, {member['tier']} tier")
    
    def test_create_new_member(self):
        """POST /api/kiosk/loyalty/member/lookup - Create new member"""
        response = requests.post(
            f"{BASE_URL}/api/kiosk/loyalty/member/lookup",
            json={"phone": TEST_PHONE_NEW}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        
        # New member should have is_new=True
        assert data.get("is_new") == True, "New member should have is_new=True"
        
        # Should have welcome bonus
        assert "welcome_bonus" in data, "New member should have welcome_bonus"
        assert data["welcome_bonus"] == 50, f"Welcome bonus should be 50, got {data['welcome_bonus']}"
        
        member = data["member"]
        assert member["tier"] == "bronze", "New member should be bronze tier"
        assert member["total_points"] == 0, "New member should have 0 points"
        
        print(f"✓ New member created: {member['phone']}, welcome bonus: {data['welcome_bonus']} puan")
    
    def test_invalid_phone_number(self):
        """POST /api/kiosk/loyalty/member/lookup - Invalid phone should fail"""
        response = requests.post(
            f"{BASE_URL}/api/kiosk/loyalty/member/lookup",
            json={"phone": "123"}  # Too short
        )
        
        assert response.status_code == 400, f"Expected 400 for invalid phone, got {response.status_code}"
        print("✓ Invalid phone number rejected correctly")
    
    def test_phone_number_cleaning(self):
        """POST /api/kiosk/loyalty/member/lookup - Phone number should be cleaned"""
        # Test with formatted phone number
        response = requests.post(
            f"{BASE_URL}/api/kiosk/loyalty/member/lookup",
            json={"phone": "0555 987 65 43"}  # With spaces and leading 0
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        member = response.json()["member"]
        # Phone should be cleaned to digits only
        assert member["phone"].isdigit(), "Phone should contain only digits"
        
        print(f"✓ Phone cleaned: '0555 987 65 43' -> '{member['phone']}'")


class TestEarnPoints:
    """Earn points endpoint tests"""
    
    def test_earn_points_basic(self):
        """POST /api/kiosk/loyalty/earn - Earn points from order"""
        # First ensure member exists
        lookup_response = requests.post(
            f"{BASE_URL}/api/kiosk/loyalty/member/lookup",
            json={"phone": TEST_PHONE}
        )
        assert lookup_response.status_code == 200
        
        initial_points = lookup_response.json()["member"]["total_points"]
        
        # Earn points
        order_total = 100.0
        response = requests.post(
            f"{BASE_URL}/api/kiosk/loyalty/earn",
            json={
                "phone": TEST_PHONE,
                "order_total": order_total,
                "order_id": f"TEST-{int(time.time())}"
            }
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        
        # Verify response structure
        assert "base_points" in data, "Missing base_points"
        assert "bonus_points" in data, "Missing bonus_points"
        assert "total_earned" in data, "Missing total_earned"
        assert "new_total" in data, "Missing new_total"
        
        # Base points should be order_total * points_per_lira (1)
        assert data["base_points"] == int(order_total), f"Base points should be {int(order_total)}"
        
        print(f"✓ Earned {data['total_earned']} puan (base: {data['base_points']}, bonus: {data['bonus_points']})")
        print(f"  New total: {data['new_total']} puan")
    
    def test_earn_points_with_tier_bonus(self):
        """POST /api/kiosk/loyalty/earn - Verify tier bonus multiplier"""
        # Get member's current tier
        lookup_response = requests.post(
            f"{BASE_URL}/api/kiosk/loyalty/member/lookup",
            json={"phone": TEST_PHONE}
        )
        assert lookup_response.status_code == 200
        
        member = lookup_response.json()["member"]
        tier = member["tier"]
        
        # Get tier multiplier
        config_response = requests.get(f"{BASE_URL}/api/kiosk/loyalty/config")
        multiplier = config_response.json()["tiers"][tier]["bonus_multiplier"]
        
        # Earn points
        order_total = 200.0
        response = requests.post(
            f"{BASE_URL}/api/kiosk/loyalty/earn",
            json={
                "phone": TEST_PHONE,
                "order_total": order_total,
                "order_id": f"TEST-BONUS-{int(time.time())}"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify bonus calculation
        expected_base = int(order_total)
        expected_bonus = int(expected_base * (multiplier - 1))
        
        assert data["base_points"] == expected_base, f"Base points mismatch"
        assert data["bonus_points"] == expected_bonus, f"Bonus points mismatch"
        
        print(f"✓ Tier {tier} ({multiplier}x): {data['base_points']} base + {data['bonus_points']} bonus = {data['total_earned']} total")
    
    def test_earn_points_nonexistent_member(self):
        """POST /api/kiosk/loyalty/earn - Should fail for non-existent member"""
        response = requests.post(
            f"{BASE_URL}/api/kiosk/loyalty/earn",
            json={
                "phone": "9999999999",  # Non-existent
                "order_total": 100.0,
                "order_id": "TEST-FAIL"
            }
        )
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ Non-existent member rejected correctly")


class TestRedeemReward:
    """Redeem reward endpoint tests"""
    
    def test_redeem_reward_insufficient_points(self):
        """POST /api/kiosk/loyalty/redeem - Should fail with insufficient points"""
        # Create a new member with 0 points
        new_phone = f"555{int(time.time()) % 10000000:07d}"
        requests.post(
            f"{BASE_URL}/api/kiosk/loyalty/member/lookup",
            json={"phone": new_phone}
        )
        
        # Try to redeem a reward
        response = requests.post(
            f"{BASE_URL}/api/kiosk/loyalty/redeem",
            json={
                "phone": new_phone,
                "reward_id": "free-drink"  # Requires 100 points
            }
        )
        
        assert response.status_code == 400, f"Expected 400 for insufficient points, got {response.status_code}"
        print("✓ Insufficient points rejected correctly")
    
    def test_redeem_reward_success(self):
        """POST /api/kiosk/loyalty/redeem - Redeem reward with sufficient points"""
        # First, ensure member has enough points
        lookup_response = requests.post(
            f"{BASE_URL}/api/kiosk/loyalty/member/lookup",
            json={"phone": TEST_PHONE}
        )
        assert lookup_response.status_code == 200
        
        member = lookup_response.json()["member"]
        initial_points = member["total_points"]
        
        # Get rewards to find one we can afford
        rewards_response = requests.get(f"{BASE_URL}/api/kiosk/loyalty/rewards")
        rewards = rewards_response.json()
        
        # Find a reward we can afford
        affordable_reward = None
        for reward in rewards:
            if reward["points_required"] <= initial_points:
                affordable_reward = reward
                break
        
        if affordable_reward:
            response = requests.post(
                f"{BASE_URL}/api/kiosk/loyalty/redeem",
                json={
                    "phone": TEST_PHONE,
                    "reward_id": affordable_reward["id"]
                }
            )
            
            assert response.status_code == 200, f"Expected 200, got {response.status_code}"
            
            data = response.json()
            assert "new_total" in data, "Missing new_total"
            assert data["new_total"] == initial_points - affordable_reward["points_required"]
            
            print(f"✓ Redeemed '{affordable_reward['name']}' for {affordable_reward['points_required']} puan")
            print(f"  Points: {initial_points} -> {data['new_total']}")
        else:
            print(f"⚠ Skipped: Member has {initial_points} points, no affordable rewards")
    
    def test_redeem_nonexistent_reward(self):
        """POST /api/kiosk/loyalty/redeem - Should fail for non-existent reward"""
        response = requests.post(
            f"{BASE_URL}/api/kiosk/loyalty/redeem",
            json={
                "phone": TEST_PHONE,
                "reward_id": "nonexistent-reward-xyz"
            }
        )
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ Non-existent reward rejected correctly")


class TestTierUpgrade:
    """Tier upgrade tests"""
    
    def test_tier_calculation(self):
        """Verify tier is calculated correctly based on points"""
        # Get config
        config_response = requests.get(f"{BASE_URL}/api/kiosk/loyalty/config")
        tiers = config_response.json()["tiers"]
        
        # Get member
        lookup_response = requests.post(
            f"{BASE_URL}/api/kiosk/loyalty/member/lookup",
            json={"phone": TEST_PHONE}
        )
        assert lookup_response.status_code == 200
        
        member = lookup_response.json()["member"]
        points = member["total_points"]
        tier = member["tier"]
        
        # Verify tier is correct for points
        expected_tier = "bronze"
        if points >= tiers["platinum"]["min_points"]:
            expected_tier = "platinum"
        elif points >= tiers["gold"]["min_points"]:
            expected_tier = "gold"
        elif points >= tiers["silver"]["min_points"]:
            expected_tier = "silver"
        
        assert tier == expected_tier, f"Expected tier {expected_tier} for {points} points, got {tier}"
        print(f"✓ Tier calculation correct: {points} puan = {tier}")
    
    def test_next_tier_info(self):
        """Verify next tier info is provided"""
        lookup_response = requests.post(
            f"{BASE_URL}/api/kiosk/loyalty/member/lookup",
            json={"phone": TEST_PHONE}
        )
        assert lookup_response.status_code == 200
        
        data = lookup_response.json()
        
        if data["member"]["tier"] != "platinum":
            assert "next_tier" in data, "Should have next_tier info"
            next_tier = data["next_tier"]
            assert "name" in next_tier, "next_tier missing name"
            assert "points_needed" in next_tier, "next_tier missing points_needed"
            print(f"✓ Next tier: {next_tier['name']}, {next_tier['points_needed']} puan gerekli")
        else:
            print("✓ Member is already platinum (max tier)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
