"""AI-assisted features — stub service.

AI outputs are treated as untrusted input.
AI cannot modify meeting state, assign ownership, or change deadlines.
All suggestions must pass backend validation before being persisted.
"""

import logging

logger = logging.getLogger(__name__)


def suggest_agenda_topics(title: str, context: str = "") -> list[dict]:
    """Suggest agenda topics based on meeting title."""
    logger.info("AI: Generating agenda suggestions for '%s'", title)
    # Stub — in production this would call an LLM
    return [
        {"topic": f"Review progress on {title}", "time_allocation": 10},
        {"topic": "Open discussion and blockers", "time_allocation": 10},
        {"topic": "Decisions and next steps", "time_allocation": 10},
    ]


def suggest_action_items(meeting_title: str, agenda_topics: list[str]) -> list[dict]:
    """Suggest action items based on meeting agenda."""
    logger.info("AI: Generating action items for '%s'", meeting_title)
    suggestions = []
    for topic in agenda_topics[:3]:
        suggestions.append(
            {
                "description": f"Follow up on: {topic}",
                "owner": "",
                "deadline": "",
            }
        )
    return suggestions


def summarize_review(meeting_title: str, action_items: list[dict]) -> dict:
    """Generate a review summary suggestion."""
    logger.info("AI: Generating review summary for '%s'", meeting_title)
    completed = sum(1 for a in action_items if a.get("status") == "Completed")
    total = len(action_items)
    return {
        "summary": (
            f"Meeting '{meeting_title}' concluded with {total} action items. "
            f"{completed} completed, {total - completed} pending."
        ),
        "suggested_rating": 3 if completed >= total // 2 else 2,
    }
