from datetime import datetime, timedelta, timezone
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_booking_cost_estimate():
    now = datetime.now(timezone.utc)
    future = now + timedelta(hours=4)

    response = client.post("/api/bookings/estimate", json={
        "vehicle_id": 1,
        "start_time": now.isoformat(),
        "expected_return_time": future.isoformat()
    })
    assert response.status_code == 200
    data = response.json()
    assert data["duration_hours"] == 4.0
    assert data["total_amount"] > 0
    assert data["taxes_fees"] > 0

def test_booking_lifecycle_for_customer():
    # 1. Login as customer
    login_res = client.post("/api/auth/login", json={
        "email": "customer@rollnride.com",
        "password": "Customer123!"
    })
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Find an available vehicle
    v_res = client.get("/api/vehicles?status=AVAILABLE&limit=1")
    assert v_res.status_code == 200
    vehicles = v_res.json()
    if not vehicles:
        return # Skip if all in use
    vehicle = vehicles[0]

    # 3. Create booking
    now = datetime.now(timezone.utc)
    b_res = client.post("/api/bookings", headers=headers, json={
        "vehicle_id": vehicle["id"],
        "pickup_warehouse_id": vehicle["warehouse_id"] or 1,
        "return_warehouse_id": 2,
        "start_time": now.isoformat(),
        "expected_return_time": (now + timedelta(hours=3)).isoformat()
    })
    assert b_res.status_code == 200
    booking = b_res.json()
    assert booking["status"] == "CONFIRMED"
    booking_id = booking["id"]

    # 4. Start trip
    start_res = client.post(f"/api/bookings/{booking_id}/start", headers=headers)
    assert start_res.status_code == 200
    assert start_res.json()["status"] == "ACTIVE"

    # 5. Complete trip (returns vehicle -> enters cleaning queue)
    comp_res = client.post(f"/api/bookings/{booking_id}/complete", headers=headers)
    assert comp_res.status_code == 200
    assert comp_res.json()["status"] == "COMPLETED"
