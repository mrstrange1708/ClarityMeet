"""Agenda API routes."""

from flask import Blueprint, request, jsonify
from services import agenda_service

agenda_bp = Blueprint("agenda", __name__)


@agenda_bp.route("/api/meetings/<int:meeting_id>/agenda", methods=["POST"])
def add_agenda_item(meeting_id):
    data = request.get_json()
    try:
        item = agenda_service.add_agenda_item(
            meeting_id=meeting_id,
            topic=data.get("topic", ""),
            time_allocation=data.get("time_allocation"),
        )
        return jsonify(item.to_dict()), 201
    except LookupError as e:
        return jsonify({"error": str(e)}), 404
    except ValueError as e:
        return jsonify({"error": str(e)}), 400


@agenda_bp.route("/api/agenda/<int:item_id>", methods=["DELETE"])
def delete_agenda_item(item_id):
    try:
        agenda_service.delete_agenda_item(item_id)
        return jsonify({"message": "Agenda item deleted."}), 200
    except LookupError as e:
        return jsonify({"error": str(e)}), 404
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
