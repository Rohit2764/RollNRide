import sys
import os

# Add backend directory to sys.path
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

import pytest
from app.core.database import Base, engine
from app.core.seed import seed_database

@pytest.fixture(scope="session", autouse=True)
def setup_test_database():
    Base.metadata.create_all(bind=engine)
    try:
        seed_database()
    except Exception:
        pass
    yield
