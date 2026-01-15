#!/usr/bin/env python3
"""
KasaBurger Backend API Test Suite
Tests all endpoints for the burger manufacturing management system
"""

import requests
import sys
import json
from datetime import datetime, timedelta
import uuid

class KasaBurgerAPITester:
    def __init__(self, base_url="https://kasaburger-pos.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        
        # Store created IDs for cleanup and testing
        self.created_ids = {
            'products': [],
            'materials': [],
            'recipes': [],
            'production': [],
            'dealers': [],
            'orders': [],
            'invoices': [],
            'transactions': []
        }

    def log_result(self, test_name, success, response_data=None, error_msg=None):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {test_name} - PASSED")
            if response_data:
                print(f"   Response: {json.dumps(response_data, indent=2)[:200]}...")
        else:
            self.failed_tests.append({'test': test_name, 'error': error_msg})
            print(f"❌ {test_name} - FAILED")
            if error_msg:
                print(f"   Error: {error_msg}")

    def make_request(self, method, endpoint, data=None, expected_status=200):
        """Make HTTP request with proper headers"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)
            else:
                return False, f"Unsupported method: {method}"

            success = response.status_code == expected_status
            response_data = {}
            
            try:
                response_data = response.json()
            except:
                response_data = {"raw_response": response.text}

            if not success:
                error_msg = f"Expected {expected_status}, got {response.status_code}. Response: {response_data}"
                return False, error_msg
                
            return True, response_data

        except requests.exceptions.RequestException as e:
            return False, f"Request failed: {str(e)}"

    def test_health_check(self):
        """Test basic health endpoints"""
        print("\n🔍 Testing Health Check Endpoints...")
        
        # Test root endpoint
        success, response = self.make_request('GET', '', expected_status=200)
        self.log_result("Root endpoint", success, response)
        
        # Test health endpoint
        success, response = self.make_request('GET', 'health', expected_status=200)
        self.log_result("Health check", success, response)

    def test_authentication(self):
        """Test user registration and login"""
        print("\n🔍 Testing Authentication...")
        
        # Generate unique test user
        timestamp = datetime.now().strftime('%H%M%S')
        test_email = f"test_user_{timestamp}@kasaburger.com"
        test_password = "TestPass123!"
        test_name = f"Test User {timestamp}"

        # Test user registration
        register_data = {
            "email": test_email,
            "password": test_password,
            "name": test_name,
            "role": "admin"
        }
        
        success, response = self.make_request('POST', 'auth/register', register_data, expected_status=200)
        self.log_result("User registration", success, response)
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.user_id = response['user']['id']
            print(f"   Token obtained: {self.token[:20]}...")

        # Test user login
        login_data = {
            "email": test_email,
            "password": test_password
        }
        
        success, response = self.make_request('POST', 'auth/login', login_data, expected_status=200)
        self.log_result("User login", success, response)

        # Test get current user
        success, response = self.make_request('GET', 'auth/me', expected_status=200)
        self.log_result("Get current user", success, response)

    def test_products_crud(self):
        """Test Products CRUD operations"""
        print("\n🔍 Testing Products CRUD...")
        
        # Create product
        product_data = {
            "name": "Test Burger Köftesi",
            "code": f"BK-TEST-{datetime.now().strftime('%H%M%S')}",
            "unit": "kg",
            "base_price": 150.50,
            "description": "Test burger köftesi"
        }
        
        success, response = self.make_request('POST', 'products', product_data, expected_status=200)
        self.log_result("Create product", success, response)
        
        product_id = None
        if success and 'id' in response:
            product_id = response['id']
            self.created_ids['products'].append(product_id)

        # Get all products
        success, response = self.make_request('GET', 'products', expected_status=200)
        self.log_result("Get all products", success, response)

        # Get specific product
        if product_id:
            success, response = self.make_request('GET', f'products/{product_id}', expected_status=200)
            self.log_result("Get specific product", success, response)

            # Update product
            update_data = {
                "name": "Updated Test Burger Köftesi",
                "code": product_data["code"],
                "unit": "kg",
                "base_price": 175.00,
                "description": "Updated test burger köftesi"
            }
            
            success, response = self.make_request('PUT', f'products/{product_id}', update_data, expected_status=200)
            self.log_result("Update product", success, response)

    def test_materials_crud(self):
        """Test Materials CRUD operations"""
        print("\n🔍 Testing Materials CRUD...")
        
        # Create material
        material_data = {
            "name": "Test Dana Kıyma",
            "code": f"HM-TEST-{datetime.now().strftime('%H%M%S')}",
            "unit": "kg",
            "stock_quantity": 100.0,
            "min_stock": 10.0,
            "unit_price": 80.00
        }
        
        success, response = self.make_request('POST', 'materials', material_data, expected_status=200)
        self.log_result("Create material", success, response)
        
        material_id = None
        if success and 'id' in response:
            material_id = response['id']
            self.created_ids['materials'].append(material_id)

        # Get all materials
        success, response = self.make_request('GET', 'materials', expected_status=200)
        self.log_result("Get all materials", success, response)

        # Update material
        if material_id:
            update_data = {
                "name": "Updated Test Dana Kıyma",
                "code": material_data["code"],
                "unit": "kg",
                "stock_quantity": 150.0,
                "min_stock": 15.0,
                "unit_price": 85.00
            }
            
            success, response = self.make_request('PUT', f'materials/{material_id}', update_data, expected_status=200)
            self.log_result("Update material", success, response)

    def test_stock_movements(self):
        """Test Stock Movement operations"""
        print("\n🔍 Testing Stock Movements...")
        
        if not self.created_ids['materials']:
            print("   Skipping stock movements - no materials created")
            return

        material_id = self.created_ids['materials'][0]
        
        # Create stock movement (in)
        movement_data = {
            "material_id": material_id,
            "material_name": "Test Dana Kıyma",
            "type": "in",
            "quantity": 50.0,
            "reason": "Test satın alma"
        }
        
        success, response = self.make_request('POST', 'stock-movements', movement_data, expected_status=200)
        self.log_result("Create stock movement (in)", success, response)

        # Create stock movement (out)
        movement_data_out = {
            "material_id": material_id,
            "material_name": "Test Dana Kıyma",
            "type": "out",
            "quantity": 20.0,
            "reason": "Test üretim"
        }
        
        success, response = self.make_request('POST', 'stock-movements', movement_data_out, expected_status=200)
        self.log_result("Create stock movement (out)", success, response)

        # Get all stock movements
        success, response = self.make_request('GET', 'stock-movements', expected_status=200)
        self.log_result("Get all stock movements", success, response)

    def test_recipes_crud(self):
        """Test Recipes CRUD operations"""
        print("\n🔍 Testing Recipes CRUD...")
        
        if not self.created_ids['products'] or not self.created_ids['materials']:
            print("   Skipping recipes - need products and materials")
            return

        product_id = self.created_ids['products'][0]
        material_id = self.created_ids['materials'][0]
        
        # Create recipe
        recipe_data = {
            "product_id": product_id,
            "product_name": "Test Burger Köftesi",
            "ingredients": [
                {
                    "material_id": material_id,
                    "material_name": "Test Dana Kıyma",
                    "quantity": 1.0,
                    "unit": "kg"
                }
            ],
            "yield_quantity": 10.0,
            "yield_unit": "adet",
            "notes": "Test reçete"
        }
        
        success, response = self.make_request('POST', 'recipes', recipe_data, expected_status=200)
        self.log_result("Create recipe", success, response)
        
        if success and 'id' in response:
            self.created_ids['recipes'].append(response['id'])

        # Get all recipes
        success, response = self.make_request('GET', 'recipes', expected_status=200)
        self.log_result("Get all recipes", success, response)

    def test_production_crud(self):
        """Test Production CRUD operations"""
        print("\n🔍 Testing Production CRUD...")
        
        if not self.created_ids['recipes']:
            print("   Skipping production - need recipes")
            return

        recipe_id = self.created_ids['recipes'][0]
        
        # Create production order
        production_data = {
            "recipe_id": recipe_id,
            "product_name": "Test Burger Köftesi",
            "quantity": 100.0,
            "planned_date": (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d'),
            "notes": "Test üretim emri"
        }
        
        success, response = self.make_request('POST', 'production', production_data, expected_status=200)
        self.log_result("Create production order", success, response)
        
        production_id = None
        if success and 'id' in response:
            production_id = response['id']
            self.created_ids['production'].append(production_id)

        # Get all production orders
        success, response = self.make_request('GET', 'production', expected_status=200)
        self.log_result("Get all production orders", success, response)

        # Update production status
        if production_id:
            success, response = self.make_request('PUT', f'production/{production_id}/status?status=in_progress', expected_status=200)
            self.log_result("Update production status", success, response)

    def test_dealers_crud(self):
        """Test Dealers CRUD operations"""
        print("\n🔍 Testing Dealers CRUD...")
        
        # Create dealer
        dealer_data = {
            "name": f"Test Bayi {datetime.now().strftime('%H%M%S')}",
            "code": f"BY-TEST-{datetime.now().strftime('%H%M%S')}",
            "contact_person": "Test Kişi",
            "phone": "0555 123 4567",
            "email": "test@bayi.com",
            "address": "Test Adres",
            "tax_number": "1234567890",
            "pricing": []
        }
        
        success, response = self.make_request('POST', 'dealers', dealer_data, expected_status=200)
        self.log_result("Create dealer", success, response)
        
        dealer_id = None
        if success and 'id' in response:
            dealer_id = response['id']
            self.created_ids['dealers'].append(dealer_id)

        # Get all dealers
        success, response = self.make_request('GET', 'dealers', expected_status=200)
        self.log_result("Get all dealers", success, response)

        # Get specific dealer
        if dealer_id:
            success, response = self.make_request('GET', f'dealers/{dealer_id}', expected_status=200)
            self.log_result("Get specific dealer", success, response)

            # Update dealer
            update_data = {
                "name": "Updated Test Bayi",
                "code": dealer_data["code"],
                "contact_person": "Updated Test Kişi",
                "phone": "0555 987 6543",
                "email": "updated@bayi.com",
                "address": "Updated Test Adres",
                "tax_number": "0987654321",
                "pricing": []
            }
            
            success, response = self.make_request('PUT', f'dealers/{dealer_id}', update_data, expected_status=200)
            self.log_result("Update dealer", success, response)

    def test_orders_crud(self):
        """Test Orders CRUD operations"""
        print("\n🔍 Testing Orders CRUD...")
        
        if not self.created_ids['dealers'] or not self.created_ids['products']:
            print("   Skipping orders - need dealers and products")
            return

        dealer_id = self.created_ids['dealers'][0]
        product_id = self.created_ids['products'][0]
        
        # Create order
        order_data = {
            "dealer_id": dealer_id,
            "dealer_name": "Test Bayi",
            "items": [
                {
                    "product_id": product_id,
                    "product_name": "Test Burger Köftesi",
                    "quantity": 10.0,
                    "unit_price": 150.00,
                    "total": 1500.00
                }
            ],
            "delivery_date": (datetime.now() + timedelta(days=3)).strftime('%Y-%m-%d'),
            "notes": "Test sipariş"
        }
        
        success, response = self.make_request('POST', 'orders', order_data, expected_status=200)
        self.log_result("Create order", success, response)
        
        order_id = None
        if success and 'id' in response:
            order_id = response['id']
            self.created_ids['orders'].append(order_id)

        # Get all orders
        success, response = self.make_request('GET', 'orders', expected_status=200)
        self.log_result("Get all orders", success, response)

        # Update order status
        if order_id:
            success, response = self.make_request('PUT', f'orders/{order_id}/status?status=delivered', expected_status=200)
            self.log_result("Update order status", success, response)

    def test_invoices_crud(self):
        """Test Invoices CRUD operations"""
        print("\n🔍 Testing Invoices CRUD...")
        
        if not self.created_ids['orders'] or not self.created_ids['dealers']:
            print("   Skipping invoices - need orders and dealers")
            return

        order_id = self.created_ids['orders'][0]
        dealer_id = self.created_ids['dealers'][0]
        
        # Create invoice
        invoice_data = {
            "order_id": order_id,
            "dealer_id": dealer_id,
            "dealer_name": "Test Bayi",
            "items": [
                {
                    "product_id": self.created_ids['products'][0] if self.created_ids['products'] else "test-id",
                    "product_name": "Test Burger Köftesi",
                    "quantity": 10.0,
                    "unit_price": 150.00,
                    "total": 1500.00
                }
            ],
            "subtotal": 1500.00,
            "tax_rate": 20,
            "tax_amount": 300.00,
            "total": 1800.00,
            "due_date": (datetime.now() + timedelta(days=30)).strftime('%Y-%m-%d')
        }
        
        success, response = self.make_request('POST', 'invoices', invoice_data, expected_status=200)
        self.log_result("Create invoice", success, response)
        
        invoice_id = None
        if success and 'id' in response:
            invoice_id = response['id']
            self.created_ids['invoices'].append(invoice_id)

        # Get all invoices
        success, response = self.make_request('GET', 'invoices', expected_status=200)
        self.log_result("Get all invoices", success, response)

        # Pay invoice
        if invoice_id:
            success, response = self.make_request('PUT', f'invoices/{invoice_id}/pay', expected_status=200)
            self.log_result("Pay invoice", success, response)

    def test_transactions_crud(self):
        """Test Transactions CRUD operations"""
        print("\n🔍 Testing Transactions CRUD...")
        
        # Create income transaction
        income_data = {
            "type": "income",
            "category": "Satış",
            "amount": 1000.00,
            "description": "Test satış geliri"
        }
        
        success, response = self.make_request('POST', 'transactions', income_data, expected_status=200)
        self.log_result("Create income transaction", success, response)
        
        if success and 'id' in response:
            self.created_ids['transactions'].append(response['id'])

        # Create expense transaction
        expense_data = {
            "type": "expense",
            "category": "Hammadde Alımı",
            "amount": 500.00,
            "description": "Test hammadde alımı"
        }
        
        success, response = self.make_request('POST', 'transactions', expense_data, expected_status=200)
        self.log_result("Create expense transaction", success, response)
        
        if success and 'id' in response:
            self.created_ids['transactions'].append(response['id'])

        # Get all transactions
        success, response = self.make_request('GET', 'transactions', expected_status=200)
        self.log_result("Get all transactions", success, response)

    def test_dashboard_stats(self):
        """Test Dashboard statistics"""
        print("\n🔍 Testing Dashboard Statistics...")
        
        success, response = self.make_request('GET', 'dashboard/stats', expected_status=200)
        self.log_result("Get dashboard stats", success, response)

    def cleanup_test_data(self):
        """Clean up created test data"""
        print("\n🧹 Cleaning up test data...")
        
        # Delete in reverse order to handle dependencies
        cleanup_order = [
            ('transactions', 'transactions'),
            ('invoices', 'invoices'),
            ('orders', 'orders'),
            ('production', 'production'),
            ('recipes', 'recipes'),
            ('dealers', 'dealers'),
            ('materials', 'materials'),
            ('products', 'products')
        ]
        
        for entity_type, endpoint in cleanup_order:
            for entity_id in self.created_ids[entity_type]:
                success, response = self.make_request('DELETE', f'{endpoint}/{entity_id}', expected_status=200)
                if success:
                    print(f"   Deleted {entity_type}: {entity_id}")
                else:
                    print(f"   Failed to delete {entity_type}: {entity_id}")

    def run_all_tests(self):
        """Run all test suites"""
        print("🚀 Starting KasaBurger API Test Suite")
        print(f"📍 Testing endpoint: {self.base_url}")
        print("=" * 60)
        
        try:
            # Core tests
            self.test_health_check()
            self.test_authentication()
            
            if not self.token:
                print("❌ Authentication failed - cannot continue with protected endpoints")
                return False
            
            # CRUD tests
            self.test_products_crud()
            self.test_materials_crud()
            self.test_stock_movements()
            self.test_recipes_crud()
            self.test_production_crud()
            self.test_dealers_crud()
            self.test_orders_crud()
            self.test_invoices_crud()
            self.test_transactions_crud()
            
            # Dashboard test
            self.test_dashboard_stats()
            
            # Cleanup
            self.cleanup_test_data()
            
        except Exception as e:
            print(f"❌ Test suite failed with exception: {str(e)}")
            return False
        
        # Print summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        print(f"Total tests run: {self.tests_run}")
        print(f"Tests passed: {self.tests_passed}")
        print(f"Tests failed: {len(self.failed_tests)}")
        print(f"Success rate: {(self.tests_passed/self.tests_run*100):.1f}%" if self.tests_run > 0 else "0%")
        
        if self.failed_tests:
            print("\n❌ FAILED TESTS:")
            for failed in self.failed_tests:
                print(f"   - {failed['test']}: {failed['error']}")
        
        return len(self.failed_tests) == 0

def main():
    """Main test runner"""
    tester = KasaBurgerAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())