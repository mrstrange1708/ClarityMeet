"""Dashboard API route."""

from flask import Blueprint, jsonify
from services import meeting_service

dashboard_bp = Blueprint("dashboard", __name__)


@dashboard_bp.route("/api/dashboard", methods=["GET"])
def get_dashboard():
    stats = meeting_service.get_dashboard_stats()
    return jsonify(stats)
