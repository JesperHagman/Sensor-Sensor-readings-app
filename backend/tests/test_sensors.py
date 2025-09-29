import json
from sensors.models import Reading, Sensor

def test_create_and_paginate_sensors(client, auth_headers):
    # Skapa 12 sensorer
    for i in range(12):
        r = client.post(
            "/api/sensors/",
            data=json.dumps({"name": f"device-{i}", "model": "Env"}),
            **auth_headers,
        )
        assert r.status_code == 201

    # Sida 2 med 5 per sida -> 5 items
    r = client.get("/api/sensors/?page=2&page_size=5", **auth_headers)
    assert r.status_code == 200
    body = r.json()
    assert body["page"] == 2
    assert body["page_size"] == 5
    assert len(body["items"]) == 5
    assert body["count"] == 12

def test_search_filters_by_name_or_model(client, auth_headers):
    client.post("/api/sensors/", data=json.dumps({"name": "device-001", "model": "EnviroSense"}), **auth_headers)
    client.post("/api/sensors/", data=json.dumps({"name": "other", "model": "ClimaTrack"}), **auth_headers)

    r = client.get("/api/sensors/?q=device", **auth_headers)
    assert r.status_code == 200
    names = [s["name"] for s in r.json()["items"]]
    assert "device-001" in names
    # q=device bör inte plocka "other" om inte model matchar; här gör den inte det.
    assert "other" not in names

def test_update_and_delete_sensor_cascade_readings(client, auth_headers):
    # Skapa sensor
    r = client.post("/api/sensors/", data=json.dumps({"name": "will-update", "model": "Env"}), **auth_headers)
    assert r.status_code == 201
    sensor_id = r.json()["id"]

    # PUT (uppdatera)
    r = client.put(
        f"/api/sensors/{sensor_id}/",
        data=json.dumps({"name": "updated-name", "model": "NewModel", "description": "desc"}),
        **auth_headers,
    )
    assert r.status_code == 200
    assert r.json()["name"] == "updated-name"
    assert r.json()["model"] == "NewModel"

    # Skapa en reading så vi kan testa kaskaddelning
    r = client.post(
        f"/api/sensors/{sensor_id}/readings/",
        data=json.dumps({"temperature": 21.5, "humidity": 45.0, "timestamp": "2024-01-01T10:00:00Z"}),
        **auth_headers,
    )
    assert r.status_code == 201
    assert Reading.objects.filter(sensor_id=sensor_id).count() == 1

    # DELETE sensor -> ska kaskad-radera readings
    r = client.delete(f"/api/sensors/{sensor_id}/", **auth_headers)
    assert r.status_code == 204

    assert not Sensor.objects.filter(id=sensor_id).exists()
    assert Reading.objects.filter(sensor_id=sensor_id).count() == 0  # kaskad OK

def test_ownership_isolated_between_users(client, auth_headers, other_auth_headers):
    # Alice skapar en sensor
    client.post("/api/sensors/", data=json.dumps({"name": "alice-sensor", "model": "Env"}), **auth_headers)

    # Alice ser 1
    r = client.get("/api/sensors/", **auth_headers)
    assert r.status_code == 200
    assert r.json()["count"] == 1

    # Bob ser 0 (får inte se Alices)
    r = client.get("/api/sensors/", **other_auth_headers)
    assert r.status_code == 200
    assert r.json()["count"] == 0
