"""
Test Departments API endpoints with hierarchy
"""

import httpx


BASE_URL = "http://localhost:8000/api/v1"


def login():
    """Login and get access token"""
    data = {"email": "admin@smarttask360.com", "password": "Admin123!"}
    response = httpx.post(f"{BASE_URL}/auth/login", json=data)
    return response.json()["access_token"]


def test_create_departments(token):
    """Test department hierarchy creation"""
    print("=" * 60)
    print("Testing Department Hierarchy Creation")
    print("=" * 60)

    headers = {"Authorization": f"Bearer {token}"}

    # Create root departments
    engineering = httpx.post(
        f"{BASE_URL}/departments/",
        json={"name": "Engineering", "description": "Engineering Department"},
        headers=headers,
    ).json()
    print(f"\n✅ Created root: {engineering['name']} (depth={engineering['depth']})")

    sales = httpx.post(
        f"{BASE_URL}/departments/",
        json={"name": "Sales", "description": "Sales Department"},
        headers=headers,
    ).json()
    print(f"✅ Created root: {sales['name']} (depth={sales['depth']})")

    # Create child departments
    backend = httpx.post(
        f"{BASE_URL}/departments/",
        json={
            "name": "Backend Team",
            "description": "Backend Development",
            "parent_id": engineering["id"],
        },
        headers=headers,
    ).json()
    print(f"✅ Created child: {backend['name']} (depth={backend['depth']})")

    frontend = httpx.post(
        f"{BASE_URL}/departments/",
        json={
            "name": "Frontend Team",
            "description": "Frontend Development",
            "parent_id": engineering["id"],
        },
        headers=headers,
    ).json()
    print(f"✅ Created child: {frontend['name']} (depth={frontend['depth']})")

    # Create grandchild department
    api_team = httpx.post(
        f"{BASE_URL}/departments/",
        json={
            "name": "API Team",
            "description": "REST API Development",
            "parent_id": backend["id"],
        },
        headers=headers,
    ).json()
    print(f"✅ Created grandchild: {api_team['name']} (depth={api_team['depth']})")

    return {
        "engineering": engineering,
        "sales": sales,
        "backend": backend,
        "frontend": frontend,
        "api_team": api_team,
    }


def test_get_all_departments(token):
    """Test GET all departments"""
    print("\n" + "=" * 60)
    print("Testing GET /api/v1/departments")
    print("=" * 60)

    headers = {"Authorization": f"Bearer {token}"}
    response = httpx.get(f"{BASE_URL}/departments/", headers=headers)

    if response.status_code == 200:
        departments = response.json()
        print(f"\n✅ Found {len(departments)} departments (hierarchical order):")
        for dept in departments:
            indent = "  " * dept["depth"]
            print(f"{indent}- {dept['name']} (depth={dept['depth']}, path={dept['path']})")
    else:
        print(f"❌ Error: {response.json()}")


def test_get_root_departments(token):
    """Test GET root departments"""
    print("\n" + "=" * 60)
    print("Testing GET /api/v1/departments/roots")
    print("=" * 60)

    headers = {"Authorization": f"Bearer {token}"}
    response = httpx.get(f"{BASE_URL}/departments/roots", headers=headers)

    if response.status_code == 200:
        departments = response.json()
        print(f"\n✅ Found {len(departments)} root departments:")
        for dept in departments:
            print(f"  - {dept['name']}")
    else:
        print(f"❌ Error: {response.json()}")


def test_get_children(token, dept):
    """Test GET department children"""
    print("\n" + "=" * 60)
    print(f"Testing GET /api/v1/departments/{dept['id']}/children")
    print("=" * 60)

    headers = {"Authorization": f"Bearer {token}"}
    response = httpx.get(f"{BASE_URL}/departments/{dept['id']}/children", headers=headers)

    if response.status_code == 200:
        children = response.json()
        print(f"\n✅ {dept['name']} has {len(children)} children:")
        for child in children:
            print(f"  - {child['name']}")
    else:
        print(f"❌ Error: {response.json()}")


def test_get_descendants(token, dept):
    """Test GET department descendants"""
    print("\n" + "=" * 60)
    print(f"Testing GET /api/v1/departments/{dept['id']}/descendants")
    print("=" * 60)

    headers = {"Authorization": f"Bearer {token}"}
    response = httpx.get(f"{BASE_URL}/departments/{dept['id']}/descendants", headers=headers)

    if response.status_code == 200:
        descendants = response.json()
        print(f"\n✅ {dept['name']} has {len(descendants)} descendants:")
        for desc in descendants:
            indent = "  " * (desc["depth"] - dept["depth"])
            print(f"{indent}- {desc['name']} (depth={desc['depth']})")
    else:
        print(f"❌ Error: {response.json()}")


def test_get_ancestors(token, dept):
    """Test GET department ancestors"""
    print("\n" + "=" * 60)
    print(f"Testing GET /api/v1/departments/{dept['id']}/ancestors")
    print("=" * 60)

    headers = {"Authorization": f"Bearer {token}"}
    response = httpx.get(f"{BASE_URL}/departments/{dept['id']}/ancestors", headers=headers)

    if response.status_code == 200:
        ancestors = response.json()
        print(f"\n✅ {dept['name']} has {len(ancestors)} ancestors:")
        for anc in ancestors:
            print(f"  - {anc['name']} (depth={anc['depth']})")
    else:
        print(f"❌ Error: {response.json()}")


def test_update_department(token, dept):
    """Test PATCH department"""
    print("\n" + "=" * 60)
    print(f"Testing PATCH /api/v1/departments/{dept['id']}")
    print("=" * 60)

    headers = {"Authorization": f"Bearer {token}"}
    response = httpx.patch(
        f"{BASE_URL}/departments/{dept['id']}",
        json={"name": "Backend Engineering Team"},
        headers=headers,
    )

    if response.status_code == 200:
        updated = response.json()
        print(f"\n✅ Department updated:")
        print(f"  Old name: {dept['name']}")
        print(f"  New name: {updated['name']}")
    else:
        print(f"❌ Error: {response.json()}")


if __name__ == "__main__":
    print("Logging in...")
    token = login()
    print("✅ Logged in successfully\n")

    # Create department hierarchy
    depts = test_create_departments(token)

    # Test retrieving departments
    test_get_all_departments(token)
    test_get_root_departments(token)
    test_get_children(token, depts["engineering"])
    test_get_descendants(token, depts["engineering"])
    test_get_ancestors(token, depts["api_team"])

    # Test update
    test_update_department(token, depts["backend"])

    print("\n" + "=" * 60)
    print("✅ All department API tests completed!")
    print("=" * 60)
