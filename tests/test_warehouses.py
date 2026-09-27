from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_get_warehouses():
    response = client.get("/api/warehouses")
    assert response.status_code == 200
    warehouses = response.json()
    assert len(warehouses) >= 5
    
    # Check that workload score is within 0 - 100
    for wh in warehouses:
        assert 0.0 <= wh["workload_score"] <= 100.0
        assert wh["status"] in ["NORMAL", "BUSY", "HIGH_LOAD", "OVERLOADED", "OFFLINE"]

def test_warehouse_detail_and_factors():
    response = client.get("/api/warehouses/1")
    assert response.status_code == 200
    wh = response.json()
    assert "contributing_factors" in wh
    factors = wh["contributing_factors"]
    assert "booking_load" in factors
    assert "dispatch_load" in factors
    assert "return_load" in factors
    assert "recommended_action" in factors
