"""Meeting API routes."""

from flask import Blueprint, request, jsonify
from services import meeting_service

meetings_bp = Blueprint("meetings", __name__)


@meetings_bp.route("/api/meetings", methods=["POST"])
def create_meeting():
    data = request.get_json()
    try:
        meeting = meeting_service.create_meeting(
            title=data.get("title", ""),
            scheduled_time=data.get("scheduled_time", ""),
            duration_minutes=data.get("duration_minutes"),
        )
        return jsonify(meeting.to_dict()), 201
    except (ValueError, TypeError) as e:
        return jsonify({"error": str(e)}), 400


@meetings_bp.route("/api/meetings", methods=["GET"])
def list_meetings():
    status = request.args.get("status")
    meetings = meeting_service.get_all_meetings(status=status)
    return jsonify([m.to_dict() for m in meetings])


@meetings_bp.route("/api/meetings/<int:meeting_id>", methods=["GET"])
def get_meeting(meeting_id):
    try:
        meeting = meeting_service.get_meeting(meeting_id)
        return jsonify(meeting.to_dict())
    except LookupError as e:
        return jsonify({"error": str(e)}), 404


@meetings_bp.route("/api/meetings/<int:meeting_id>/start", methods=["PATCH"])
def start_meeting(meeting_id):
    try:
        meeting = meeting_service.start_meeting(meeting_id)
        return jsonify(meeting.to_dict())
    except LookupError as e:
        return jsonify({"error": str(e)}), 404
    except ValueError as e:
        return jsonify({"error": str(e)}), 400


@meetings_bp.route("/api/meetings/<int:meeting_id>/close", methods=["PATCH"])
def close_meeting(meeting_id):
    try:
        meeting = meeting_service.close_meeting(meeting_id)
        return jsonify(meeting.to_dict())
    except LookupError as e:
        return jsonify({"error": str(e)}), 404
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
