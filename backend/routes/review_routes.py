"""Review API routes."""

from flask import Blueprint, request, jsonify
from services import review_service

reviews_bp = Blueprint("reviews", __name__)


@reviews_bp.route("/api/meetings/<int:meeting_id>/review", methods=["POST"])
def create_review(meeting_id):
    data = request.get_json()
    try:
        review = review_service.create_review(
            meeting_id=meeting_id,
            summary=data.get("summary", ""),
            outcome_rating=data.get("outcome_rating"),
            followup_required=data.get("followup_required", False),
        )
        return jsonify(review.to_dict()), 201
    except LookupError as e:
        return jsonify({"error": str(e)}), 404
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
