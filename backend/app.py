"""Flask application entry point — ClarityMeet Backend."""

import os
import logging

from dotenv import load_dotenv
from flask import Flask
from flask_cors import CORS

from models import db

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


def create_app():
    app = Flask(__name__)

    # Database configuration — use psycopg v3 driver
    db_url = os.getenv("DATABASE_URL", "")
    if db_url.startswith("postgresql://"):
        db_url = db_url.replace("postgresql://", "postgresql+psycopg://", 1)
    app.config["SQLALCHEMY_DATABASE_URI"] = db_url
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
        "pool_pre_ping": True,
        "pool_recycle": 300,
    }

    # Initialize extensions
    CORS(app, supports_credentials=True)
    db.init_app(app)

    # Register blueprints
    from routes.meeting_routes import meetings_bp
    from routes.agenda_routes import agenda_bp
    from routes.action_routes import actions_bp
    from routes.review_routes import reviews_bp
    from routes.dashboard_routes import dashboard_bp
    from routes.ai_routes import ai_bp

    app.register_blueprint(meetings_bp)
    app.register_blueprint(agenda_bp)
    app.register_blueprint(actions_bp)
    app.register_blueprint(reviews_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(ai_bp)

    # Health check
    @app.route("/api/health")
    def health():
        return {"status": "ok", "service": "ClarityMeet"}

    # Create tables
    with app.app_context():
        db.create_all()
        logger.info("Database tables created / verified.")

    return app


# Create the app at module level (required for Vercel / WSGI servers)
app = create_app()

if __name__ == "__main__":
    app.run(debug=True, port=7777)
