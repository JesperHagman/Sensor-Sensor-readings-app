import json
import datetime
from datetime import timezone

def _setup_user_and_sensor(client, username="reader", email="reader@example.com"):
    # register & login
    client.post(
        "/api/auth/register/",
        data=json.dumps({"email": email, "username": username, "password": "pw123456"}),
        content_type="application/json",
    )
    tok = client.post(
        "/api/auth/token/",
        data=json.dumps({"username": username, "password": "pw123456"}),
        content_type="application/json",
    ).json()["access"]
    h = {"HTTP_AUTHORIZATION": f"Bearer {tok}", "content_type": "application/json"}

    # skapa sensor
    s = client.post("/api/sensors/", data=json.dumps({"name": "s1", "model": "Env"}), **h).json()
    return h, s["id"]

def test_readings_date_range_and_pagination(client):
    h, sid = _setup_user_and_sensor(client)
    base = datetime.datetime(2024, 1, 1, tzinfo=timezone.utc)

    # Skapa 5 readings med 1h mellanrum
    for i in range(5):
        r = client.post(
            f"/api/sensors/{sid}/readings/",
            data=json.dumps({
                "temperature": 20 + i,
                "humidity": 40 + i,
                "timestamp": (base + datetime.timedelta(hours=i)).isoformat()
            }),
            **h,
        )
        assert r.status_code == 201

    # Filtrera första 3 timmarna -> bör ge 3 items
    r = client.get(
        f"/api/sensors/{sid}/readings/?timestamp_from={base.isoformat()}&"
        f"timestamp_to={(base + datetime.timedelta(hours=2)).isoformat()}",
        **h,
    )
    assert r.status_code == 200
    assert len(r.json()["items"]) == 3

    # Paginera: page_size=2 -> 2 items på första sidan
    r = client.get(f"/api/sensors/{sid}/readings/?page=1&page_size=2", **h)
    assert r.status_code == 200
    assert len(r.json()["items"]) == 2
    assert r.json()["count"] == 5

def test_readings_duplicate_timestamp_returns_400(client):
    h, sid = _setup_user_and_sensor(client, username="dup", email="dup@example.com")
    ts = "2024-01-01T10:00:00Z"

    r = client.post(
        f"/api/sensors/{sid}/readings/",
        data=json.dumps({"temperature": 21.0, "humidity": 45.0, "timestamp": ts}),
        **h,
    )
    assert r.status_code == 201

    # Posta samma timestamp igen -> ska få 400 pga unique(senso r, timestamp)
    r = client.post(
        f"/api/sensors/{sid}/readings/",
        data=json.dumps({"temperature": 22.0, "humidity": 42.0, "timestamp": ts}),
        **h,
    )
    assert r.status_code == 400
    assert "detail" in r.json()
