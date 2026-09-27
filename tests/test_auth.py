import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"

def test_admin_login():
    response = client.post("/api/auth/login", json={
        "email": "admin@rollnride.com",
        "password": "Admin123!"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["role"] == "ADMIN"

def test_customer_registration_and_login():
    test_email = "newtestcustomer@rollnride.com"
    reg_response = client.post("/api/auth/register", json={
        "name": "Test Runner",
        "email": test_email,
        "phone": "+91 99999 11111",
        "password": "CustomerPass123!"
    })
    # Might already exist if rerun
    if reg_response.status_code == 200:
        data = reg_response.json()
        assert data["user"]["email"] == test_email
        assert data["user"]["role"] == "CUSTOMER"

    login_response = client.post("/api/auth/login", json={
        "email": test_email,
        "password": "CustomerPass123!"
    })
    assert login_response.status_code == 200
    data = login_response.json()
    assert "access_token" in data
