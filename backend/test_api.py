#!/usr/bin/env python3
import requests
import json
from datetime import datetime, timedelta

BASE_URL = "http://localhost:8000/api/v1"

def test_membership_system():
    """Test the complete membership management system"""
    print("🧪 Testing Ringle AI Tutor Membership System")
    print("=" * 50)
    
    # Test 1: List templates
    print("\n1. Testing template listing...")
    response = requests.get(f"{BASE_URL}/templates")
    if response.status_code == 200:
        templates = response.json()
        print(f"✅ Found {len(templates)} templates")
        for template in templates:
            print(f"   - {template['name']}: {template['customer_type']}, {template['duration_days']} days")
    else:
        print(f"❌ Failed to list templates: {response.status_code}")
    
    # Test 2: Create a new B2B template
    print("\n2. Testing B2B template creation...")
    b2b_template = {
        "name": "Enterprise Plan",
        "customer_type": "B2B",
        "duration_days": 365,
        "limits": {
            "conversation": None,  # Unlimited
            "analysis": None      # Unlimited
        }
    }
    
    response = requests.post(f"{BASE_URL}/templates", json=b2b_template)
    if response.status_code == 200:
        new_template = response.json()
        print(f"✅ Created B2B template: {new_template['id']}")
        b2b_template_id = new_template['id']
    else:
        print(f"❌ Failed to create B2B template: {response.status_code}")
        return
    
    # Test 3: List users
    print("\n3. Testing user listing...")
    response = requests.get(f"{BASE_URL}/users")
    if response.status_code == 200:
        users = response.json()
        print(f"✅ Found {len(users)} users")
        for user in users:
            print(f"   - {user['name']} ({user['email']}): {user['customer_type']}")
    else:
        print(f"❌ Failed to list users: {response.status_code}")
    
    # Test 4: Admin assigns membership
    print("\n4. Testing admin membership assignment...")
    assignment = {
        "user_id": "user-2",  # B2B user
        "template_id": b2b_template_id,
        "assigned_by": "admin-1"
    }
    
    response = requests.post(f"{BASE_URL}/admin/assign-membership", json=assignment)
    if response.status_code == 200:
        result = response.json()
        membership = result['membership']
        print(f"✅ Assigned membership: {membership['id']}")
        print(f"   - Name: {membership['name']}")
        print(f"   - Expires: {membership['expires_at']}")
        print(f"   - Limits: {membership['limits']}")
        b2b_membership_id = membership['id']
    else:
        print(f"❌ Failed to assign membership: {response.status_code}")
        return
    
    # Test 5: User payment for B2C membership
    print("\n5. Testing user payment...")
    payment = {
        "user_id": "user-1",  # B2C user
        "template_id": "premium-b2c",
        "payment_method": "credit_card",
        "amount": 19.99
    }
    
    response = requests.post(f"{BASE_URL}/payments/process", json=payment)
    if response.status_code == 200:
        result = response.json()
        membership = result['membership']
        print(f"✅ Payment processed: {result['transaction_id']}")
        print(f"   - Membership: {membership['id']}")
        print(f"   - Amount: ${membership['payment_info']['amount']}")
        b2c_membership_id = membership['id']
    else:
        print(f"❌ Failed to process payment: {response.status_code}")
        return
    
    # Test 6: Check feature usage
    print("\n6. Testing feature usage check...")
    usage_check = {
        "user_id": "user-1",
        "feature_type": "conversation"
    }
    
    response = requests.post(f"{BASE_URL}/usage/check", json=usage_check)
    if response.status_code == 200:
        result = response.json()
        print(f"✅ Can use conversation: {result['can_use']}")
        if result['can_use']:
            membership = result['membership']
            print(f"   - Current usage: {membership['usage']['conversation']}/{membership['limits']['conversation']}")
    else:
        print(f"❌ Failed to check usage: {response.status_code}")
    
    # Test 7: Update feature usage
    print("\n7. Testing feature usage update...")
    usage_update = {
        "user_id": "user-1",
        "feature_type": "conversation"
    }
    
    response = requests.post(f"{BASE_URL}/usage/update", json=usage_update)
    if response.status_code == 200:
        result = response.json()
        print(f"✅ Usage updated successfully")
        print(f"   - Current usage: {result['current_usage']}")
        print(f"   - Limits: {result['limits']}")
    else:
        print(f"❌ Failed to update usage: {response.status_code}")
    
    # Test 8: Get user memberships
    print("\n8. Testing user membership retrieval...")
    response = requests.get(f"{BASE_URL}/users/user-1/memberships")
    if response.status_code == 200:
        memberships = response.json()
        print(f"✅ Found {len(memberships)} memberships for user-1")
        for membership in memberships:
            print(f"   - {membership['name']} ({membership['status']})")
    else:
        print(f"❌ Failed to get user memberships: {response.status_code}")
    
    print("\n" + "=" * 50)
    print("🎉 Test completed!")

if __name__ == "__main__":
    import time
    print("Please start the server with: python -m uvicorn main:app --reload --port 8000")
    print("Press Enter when server is ready...")
    input()
    
    try:
        test_membership_system()
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to server. Please make sure it's running on port 8000")
    except Exception as e:
        print(f"❌ Test failed with error: {e}")