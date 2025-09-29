import json

def test_register_and_login(client):
    r = client.post(
        "/api/auth/register/",
        data=json.dumps({"email": "a@b.se", "username": "alice", "password": "secret123"}),
        content_type="application/json",
    )
    assert r.status_code == 201

    r = client.post(
        "/api/auth/token/",
        data=json.dumps({"username": "alice", "password": "secret123"}),
        content_type="application/json",
    )
    assert r.status_code == 200
    body = r.json()
    assert "access" in body and "refresh" in body

def test_protected_endpoint_requires_token(client):
    r = client.get("/api/sensors/")  # ingen Authorization
    assert r.status_code == 401

def test_protected_endpoint_with_token(client, auth_headers):
    r = client.get("/api/sensors/", **auth_headers)
    # paginerad output från Ninja: {"items": [], "count": 0, "page": 1, "page_size": 10}
    assert r.status_code == 200
    assert "items" in r.json()
