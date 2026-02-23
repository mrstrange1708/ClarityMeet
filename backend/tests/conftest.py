"""Backend test suite for ClarityMeet.

Uses a separate test PostgreSQL schema or SQLite in-memory for isolation.
"""

import os
import sys
import pytest

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app
from models import db as _db


@pytest.fixture(scope="session")
def app():
    """Create a test Flask app with in-memory SQLite for speed."""
    os.environ["DATABASE_URL"] = "sqlite:///:memory:"
    application = create_app()
    application.config["TESTING"] = True
    yield application


@pytest.fixture(scope="function")
def db(app):
    """Provide clean database for each test."""
    with app.app_context():
        _db.create_all()
        yield _db
        _db.session.rollback()
        _db.drop_all()


@pytest.fixture
def client(app, db):
    """Test client."""
    return app.test_client()
