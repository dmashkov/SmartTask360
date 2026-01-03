"""
Test Users API endpoints
"""

import httpx


BASE_URL = "http://localhost:8000/api/v1"


def test_create_user():
    """Test POST /users"""
    print("=" * 60)
    print("Testing POST /api/v1/users")
    print("=" * 60)

    data = {
        "email": "manager@smarttask360.com",
        "password": "Manager123!",
        "name": "Project Manager",
        "role": "manager",
    }

    response = httpx.post(f"{BASE_URL}/users/", json=data)
    print(f"Status Code: {response.status_code}")

    if response.status_code == 201:
        user = response.json()
        print(f"✅ User created successfully:")
        print(f"   ID: {user['id']}")
        print(f"   Email: {user['email']}")
        print(f"   Name: {user['name']}")
        print(f"   Role: {user['role']}")
        return user["id"]
    else:
        print(f"❌ Error: {response.json()}")
        return None


def test_get_users():
    """Test GET /users"""
    print("\n" + "=" * 60)
    print("Testing GET /api/v1/users")
    print("=" * 60)

    response = httpx.get(f"{BASE_URL}/users/")
    print(f"Status Code: {response.status_code}")

    if response.status_code == 200:
        users = response.json()
        print(f"✅ Found {len(users)} users:")
        for user in users:
            print(f"   - {user['name']} ({user['email']}) - {user['role']}")
    else:
        print(f"❌ Error: {response.json()}")


def test_get_user_by_id(user_id: str):
    """Test GET /users/{id}"""
    print("\n" + "=" * 60)
    print(f"Testing GET /api/v1/users/{user_id}")
    print("=" * 60)

    response = httpx.get(f"{BASE_URL}/users/{user_id}")
    print(f"Status Code: {response.status_code}")

    if response.status_code == 200:
        user = response.json()
        print(f"✅ User found:")
        print(f"   Name: {user['name']}")
        print(f"   Email: {user['email']}")
        print(f"   Role: {user['role']}")
    else:
        print(f"❌ Error: {response.json()}")


def test_update_user(user_id: str):
    """Test PATCH /users/{id}"""
    print("\n" + "=" * 60)
    print(f"Testing PATCH /api/v1/users/{user_id}")
    print("=" * 60)

    data = {"name": "Senior Project Manager"}

    response = httpx.patch(f"{BASE_URL}/users/{user_id}", json=data)
    print(f"Status Code: {response.status_code}")

    if response.status_code == 200:
        user = response.json()
        print(f"✅ User updated:")
        print(f"   New name: {user['name']}")
    else:
        print(f"❌ Error: {response.json()}")


def test_delete_user(user_id: str):
    """Test DELETE /users/{id}"""
    print("\n" + "=" * 60)
    print(f"Testing DELETE /api/v1/users/{user_id}")
    print("=" * 60)

    response = httpx.delete(f"{BASE_URL}/users/{user_id}")
    print(f"Status Code: {response.status_code}")

    if response.status_code == 204:
        print(f"✅ User deleted (soft delete)")
    else:
        print(f"❌ Error: {response.json()}")


if __name__ == "__main__":
    # Test GET all users (should have admin)
    test_get_users()

    # Test CREATE user
    user_id = test_create_user()

    if user_id:
        # Test GET by ID
        test_get_user_by_id(user_id)

        # Test UPDATE
        test_update_user(user_id)

        # Test GET all again (should have 2 users)
        test_get_users()

        # Test DELETE
        test_delete_user(user_id)

        # Test GET all again (user should be inactive)
        test_get_users()

    print("\n" + "=" * 60)
    print("✅ All API tests completed!")
    print("=" * 60)
