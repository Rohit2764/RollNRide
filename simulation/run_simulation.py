"""
Standalone CLI Simulator Runner for RollNRide
Can be run independently: python simulation/run_simulation.py
"""
import sys
import os
import time
import requests

BACKEND_URL = os.environ.get("BACKEND_URL", "http://localhost:8000")

def check_backend():
    try:
        r = requests.get(f"{BACKEND_URL}/health", timeout=3)
        return r.status_code == 200
    except Exception:
        return False

def main():
    print("=" * 60)
    print("  RollNRide — Autonomous Fleet Simulation Runner")
    print("=" * 60)
    print(f"Connecting to Backend API at {BACKEND_URL}...")

    if not check_backend():
        print("Backend server is not reachable. Please start the backend service first:")
        print("  cd backend && uvicorn app.main:app --port 8000")
        sys.exit(1)

    print("Backend connected successfully!")
    print("Enabling live simulation...")

    r = requests.post(f"{BACKEND_URL}/api/simulation/toggle", json={"enabled": True})
    print(f"Server response: {r.json()}")

    try:
        while True:
            r = requests.get(f"{BACKEND_URL}/api/simulation/status")
            print(f"[{time.strftime('%X')}] Simulation Status: {r.json()}")
            time.sleep(10)
    except KeyboardInterrupt:
        print("\nStopping simulation...")
        requests.post(f"{BACKEND_URL}/api/simulation/toggle", json={"enabled": False})
        print("Simulation paused.")

if __name__ == "__main__":
    main()
