import json
import pytest

# Gör DB tillgänglig för ALLA tester automatiskt
@pytest.fixture(autouse=True)
def enable_db_access_for_all_tests(db):
    pass

# (behåll gärna denna också – dubbel säkerhet)
pytestmark = pytest.mark.django_db

# Skapar en användare och returnerar Authorization-headers
def _make_auth_headers(client, username="user", email="u@u.se", password="pw123456"):
    client.post(
        "/api/auth/register/",
        data=json.dumps({"email": email, "username": username, "password": password}),
        content_type="application/json",
    )
    r = client.post(
        "/api/auth/token/",
        data=json.dumps({"username": username, "password": password}),
        content_type="application/json",
    )
    access = r.json()["access"]
    return {"HTTP_AUTHORIZATION": f"Bearer {access}", "content_type": "application/json"}

@pytest.fixture
def auth_headers(client):
    return _make_auth_headers(client, username="alice", email="alice@example.com")

@pytest.fixture
def other_auth_headers(client):
    return _make_auth_headers(client, username="bob", email="bob@example.com")
