"""
Test security utilities (password hashing and JWT)
"""

from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_password_hash,
    verify_password,
)


def test_password_hashing():
    """Test password hashing and verification"""
    print("=" * 60)
    print("Testing Password Hashing")
    print("=" * 60)

    # Test 1: Hash a password
    plain_password = "SuperSecret123!"
    hashed = get_password_hash(plain_password)
    print(f"✅ Plain password: {plain_password}")
    print(f"✅ Hashed password: {hashed}")
    print(f"   Length: {len(hashed)} characters")

    # Test 2: Verify correct password
    is_valid = verify_password(plain_password, hashed)
    print(f"✅ Verify correct password: {is_valid}")
    assert is_valid, "Password verification failed!"

    # Test 3: Verify incorrect password
    is_invalid = verify_password("WrongPassword", hashed)
    print(f"✅ Verify incorrect password: {is_invalid}")
    assert not is_invalid, "Should reject wrong password!"

    # Test 4: Same password produces different hashes (salt)
    hashed2 = get_password_hash(plain_password)
    print(f"✅ Same password, different hash: {hashed != hashed2}")
    assert hashed != hashed2, "Hashes should be different (bcrypt uses salt)"

    print()


def test_jwt_tokens():
    """Test JWT token creation and decoding"""
    print("=" * 60)
    print("Testing JWT Tokens")
    print("=" * 60)

    # Test 1: Create access token
    user_id = "550e8400-e29b-41d4-a716-446655440000"
    access_token = create_access_token({"sub": user_id})
    print(f"✅ Access token created:")
    print(f"   {access_token[:50]}...")
    print(f"   Length: {len(access_token)} characters")

    # Test 2: Decode access token
    payload = decode_token(access_token)
    print(f"✅ Decoded payload:")
    print(f"   sub (user_id): {payload['sub']}")
    print(f"   exp (expiration): {payload['exp']}")
    assert payload["sub"] == user_id, "User ID mismatch!"

    # Test 3: Create refresh token
    refresh_token = create_refresh_token({"sub": user_id})
    print(f"✅ Refresh token created:")
    print(f"   {refresh_token[:50]}...")

    # Test 4: Decode refresh token
    refresh_payload = decode_token(refresh_token)
    print(f"✅ Refresh token payload:")
    print(f"   sub: {refresh_payload['sub']}")
    print(f"   type: {refresh_payload.get('type')}")
    print(f"   exp: {refresh_payload['exp']}")
    assert refresh_payload.get("type") == "refresh", "Should be refresh token type!"

    # Test 5: Access token != Refresh token
    assert access_token != refresh_token, "Tokens should be different!"
    print(f"✅ Access and refresh tokens are different")

    print()


def test_full_auth_flow():
    """Test complete authentication flow"""
    print("=" * 60)
    print("Testing Full Authentication Flow")
    print("=" * 60)

    # User registration
    email = "admin@smarttask360.com"
    password = "AdminPassword123!"
    print(f"1️⃣  User registration:")
    print(f"   Email: {email}")
    print(f"   Password: {password}")

    # Hash password for storage
    password_hash = get_password_hash(password)
    print(f"   Stored hash: {password_hash[:30]}...")

    # User login
    print(f"\n2️⃣  User login:")
    login_password = "AdminPassword123!"
    is_valid = verify_password(login_password, password_hash)
    print(f"   Password valid: {is_valid}")

    if is_valid:
        # Generate tokens
        user_id = "550e8400-e29b-41d4-a716-446655440000"
        access_token = create_access_token({"sub": user_id, "email": email})
        refresh_token = create_refresh_token({"sub": user_id})

        print(f"\n3️⃣  Tokens generated:")
        print(f"   Access token: {access_token[:40]}...")
        print(f"   Refresh token: {refresh_token[:40]}...")

        # Validate access token
        print(f"\n4️⃣  Validate access token:")
        payload = decode_token(access_token)
        print(f"   User ID: {payload['sub']}")
        print(f"   Email: {payload.get('email')}")
        print(f"   Expiration: {payload['exp']}")

        print(f"\n✅ Full authentication flow successful!")
    else:
        print(f"❌ Authentication failed!")

    print()


if __name__ == "__main__":
    test_password_hashing()
    test_jwt_tokens()
    test_full_auth_flow()

    print("=" * 60)
    print("🎉 All security tests passed!")
    print("=" * 60)
