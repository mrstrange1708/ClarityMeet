"""Action item API routes."""

from flask import Blueprint, request, jsonify
from services import action_item_service

actions_bp = Blueprint("actions", __name__)


@actions_bp.route("/api/meetings/<int:meeting_id>/actions", methods=["POST"])
def create_action_item(meeting_id):
    data = request.get_json()
    try:
        action = action_item_service.create_action_item(
            meeting_id=meeting_id,
            description=data.get("description", ""),
            owner=data.get("owner", ""),
            deadline=data.get("deadline", ""),
        )
        return jsonify(action.to_dict()), 201
    except LookupError as e:
        return jsonify({"error": str(e)}), 404
    except ValueError as e:
        return jsonify({"error": str(e)}), 400


@actions_bp.route("/api/actions/<int:action_id>/complete", methods=["PATCH"])
def complete_action_item(action_id):
    try:
        action = action_item_service.complete_action_item(action_id)
        return jsonify(action.to_dict())
    except LookupError as e:
        return jsonify({"error": str(e)}), 404
    except ValueError as e:
        return jsonify({"error": str(e)}), 400


@actions_bp.route("/api/meetings/<int:meeting_id>/actions", methods=["GET"])
def list_action_items(meeting_id):
    try:
        actions = action_item_service.get_actions_for_meeting(meeting_id)
        return jsonify([a.to_dict() for a in actions])
    except LookupError as e:
        return jsonify({"error": str(e)}), 404
