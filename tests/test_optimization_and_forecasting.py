from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_demand_forecast():
    response = client.get("/api/forecast/demand")
    assert response.status_code == 200
    data = response.json()
    assert "hourly_forecast" in data
    assert len(data["hourly_forecast"]) == 24
    assert "total_predicted_demand" in data
    assert "recommendation" in data

def test_route_optimization():
    # Route from Hitec City to Airport
    response = client.post("/api/optimization/route", json={
        "origin_lat": 17.4474,
        "origin_lng": 78.3762,
        "destination_lat": 17.2403,
        "destination_lng": 78.4294,
        "avoid_congested": True
    })
    assert response.status_code == 200
    data = response.json()
    assert "recommended_route" in data
    rec = data["recommended_route"]
    assert rec["distance_km"] > 10.0
    assert rec["duration_minutes"] > 0
    assert len(rec["waypoints"]) >= 2
    assert len(rec["turn_by_turn"]) >= 2

def test_redistribution_recommendations_and_approval():
    # Login as Operations Manager
    login_res = client.post("/api/auth/login", json={
        "email": "manager@rollnride.com",
        "password": "Manager123!"
    })
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Get recommendations
    rec_res = client.get("/api/optimization/redistribution")
    assert rec_res.status_code == 200
    recs = rec_res.json()
    assert len(recs) >= 1

    pending_rec = next((r for r in recs if r["status"] == "PENDING"), None)
    if pending_rec:
        rec_id = pending_rec["id"]
        app_res = client.post(f"/api/optimization/redistribution/{rec_id}/approve", headers=headers)
        assert app_res.status_code == 200
        assert app_res.json()["status"] == "APPROVED"
