"""AI-assisted feature routes.

AI outputs are suggestions only — they do NOT modify state.
All suggestions must be submitted through normal validated endpoints.
"""

from flask import Blueprint, request, jsonify
from services import ai_service

ai_bp = Blueprint("ai", __name__)


@ai_bp.route("/api/ai/suggest-agenda", methods=["POST"])
def suggest_agenda():
    data = request.get_json()
    suggestions = ai_service.suggest_agenda_topics(
        title=data.get("title", ""),
        context=data.get("context", ""),
    )
    return jsonify({"suggestions": suggestions})


@ai_bp.route("/api/ai/suggest-actions", methods=["POST"])
def suggest_actions():
    data = request.get_json()
    suggestions = ai_service.suggest_action_items(
        meeting_title=data.get("title", ""),
        agenda_topics=data.get("agenda_topics", []),
    )
    return jsonify({"suggestions": suggestions})


@ai_bp.route("/api/ai/summarize-review", methods=["POST"])
def summarize_review():
    data = request.get_json()
    summary = ai_service.summarize_review(
        meeting_title=data.get("title", ""),
        action_items=data.get("action_items", []),
    )
    return jsonify(summary)
