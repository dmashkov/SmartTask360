"""
Test Auth API endpoints
"""

import httpx


BASE_URL = "http://localhost:8000/api/v1"


def test_login():
    """Test POST /auth/login"""
    print("=" * 60)
    print("Testing POST /api/v1/auth/login")
    print("=" * 60)

    data = {
        "email": "admin@smarttask360.com",
        "password": "Admin123!",
    }

    response = httpx.post(f"{BASE_URL}/auth/login", json=data)
    print(f"Status Code: {response.status_code}")

    if response.status_code == 200:
        tokens = response.json()
        print(f"✅ Login successful:")
        print(f"   Access Token: {tokens['access_token'][:50]}...")
        print(f"   Refresh Token: {tokens['refresh_token'][:50]}...")
        print(f"   Token Type: {tokens['token_type']}")
        return tokens
    else:
        print(f"❌ Error: {response.json()}")
        return None


def test_refresh_token(refresh_token: str):
    """Test POST /auth/refresh"""
    print("\n" + "=" * 60)
    print("Testing POST /api/v1/auth/refresh")
    print("=" * 60)

    data = {"refresh_token": refresh_token}

    response = httpx.post(f"{BASE_URL}/auth/refresh", json=data)
    print(f"Status Code: {response.status_code}")

    if response.status_code == 200:
        tokens = response.json()
        print(f"✅ Token refresh successful:")
        print(f"   New Access Token: {tokens['access_token'][:50]}...")
        print(f"   Refresh Token: {tokens['refresh_token'][:50]}...")
        return tokens
    else:
        print(f"❌ Error: {response.json()}")
        return None


def test_protected_endpoint(access_token: str):
    """Test GET /users with authentication"""
    print("\n" + "=" * 60)
    print("Testing GET /api/v1/users (protected endpoint)")
    print("=" * 60)

    headers = {"Authorization": f"Bearer {access_token}"}

    response = httpx.get(f"{BASE_URL}/users/", headers=headers)
    print(f"Status Code: {response.status_code}")

    if response.status_code == 200:
        users = response.json()
        print(f"✅ Authenticated request successful:")
        print(f"   Found {len(users)} users")
    else:
        print(f"❌ Error: {response.json()}")


def test_invalid_credentials():
    """Test login with invalid credentials"""
    print("\n" + "=" * 60)
    print("Testing POST /api/v1/auth/login (invalid credentials)")
    print("=" * 60)

    data = {
        "email": "admin@smarttask360.com",
        "password": "WrongPassword",
    }

    response = httpx.post(f"{BASE_URL}/auth/login", json=data)
    print(f"Status Code: {response.status_code}")

    if response.status_code == 401:
        print(f"✅ Correctly rejected invalid credentials")
    else:
        print(f"❌ Unexpected response: {response.json()}")


def test_invalid_token():
    """Test protected endpoint with invalid token"""
    print("\n" + "=" * 60)
    print("Testing GET /api/v1/users (invalid token)")
    print("=" * 60)

    headers = {"Authorization": "Bearer invalid_token_here"}

    response = httpx.get(f"{BASE_URL}/users/", headers=headers)
    print(f"Status Code: {response.status_code}")

    if response.status_code == 401:
        print(f"✅ Correctly rejected invalid token")
    else:
        print(f"❌ Unexpected response: {response.json()}")


if __name__ == "__main__":
    # Test 1: Login with valid credentials
    tokens = test_login()

    if tokens:
        # Test 2: Refresh token
        new_tokens = test_refresh_token(tokens["refresh_token"])

        if new_tokens:
            # Test 3: Access protected endpoint with valid token
            test_protected_endpoint(new_tokens["access_token"])

        # Test 4: Invalid credentials
        test_invalid_credentials()

        # Test 5: Invalid token
        test_invalid_token()

    print("\n" + "=" * 60)
    print("✅ All auth API tests completed!")
    print("=" * 60)
