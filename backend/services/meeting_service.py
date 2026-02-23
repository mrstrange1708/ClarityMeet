"""Meeting business logic service."""

import logging
from datetime import datetime, timezone

from models import db, Meeting
from services.meeting_state_service import validate_transition

logger = logging.getLogger(__name__)


def create_meeting(title: str, scheduled_time: str, duration_minutes: int) -> Meeting:
    """Create a new meeting in Scheduled state."""
    if not title or not title.strip():
        raise ValueError("Title is required.")
    if duration_minutes is None or duration_minutes <= 0:
        raise ValueError("Duration must be a positive integer.")

    scheduled_dt = datetime.fromisoformat(scheduled_time)

    meeting = Meeting(
        title=title.strip(),
        scheduled_time=scheduled_dt,
        duration_minutes=duration_minutes,
        status="Scheduled",
    )
    db.session.add(meeting)
    db.session.commit()

    logger.info("Meeting created: id=%s title=%s", meeting.id, meeting.title)
    return meeting


def get_meeting(meeting_id: int) -> Meeting:
    """Fetch a meeting by ID or raise 404."""
    meeting = db.session.get(Meeting, meeting_id)
    if not meeting:
        raise LookupError(f"Meeting {meeting_id} not found.")
    return meeting


def get_all_meetings(status: str | None = None):
    """Return all meetings, optionally filtered by status."""
    query = Meeting.query.order_by(Meeting.scheduled_time.desc())
    if status:
        query = query.filter_by(status=status)
    return query.all()


def start_meeting(meeting_id: int) -> Meeting:
    """Transition meeting from Scheduled → InProgress."""
    meeting = get_meeting(meeting_id)
    validate_transition(meeting.status, "InProgress")
    meeting.status = "InProgress"
    db.session.commit()
    logger.info("Meeting %s started.", meeting_id)
    return meeting


def close_meeting(meeting_id: int) -> Meeting:
    """Transition meeting from InProgress → Closed.

    Pre-conditions:
        - At least 1 action item
        - All action items have owner and deadline
    """
    meeting = get_meeting(meeting_id)
    validate_transition(meeting.status, "Closed")

    if len(meeting.action_items) == 0:
        raise ValueError("Cannot close meeting without at least one action item.")

    for ai in meeting.action_items:
        if not ai.owner or not ai.owner.strip():
            raise ValueError(f"Action item '{ai.description}' is missing an owner.")
        if not ai.deadline:
            raise ValueError(f"Action item '{ai.description}' is missing a deadline.")

    meeting.status = "Closed"
    meeting.closed_at = datetime.now(timezone.utc)
    db.session.commit()
    logger.info("Meeting %s closed.", meeting_id)
    return meeting


def mark_reviewed(meeting_id: int) -> Meeting:
    """Transition meeting from Closed → Reviewed (called after review creation)."""
    meeting = get_meeting(meeting_id)
    validate_transition(meeting.status, "Reviewed")
    meeting.status = "Reviewed"
    db.session.commit()
    logger.info("Meeting %s reviewed.", meeting_id)
    return meeting


def get_dashboard_stats():
    """Return dashboard aggregates."""
    from models import ActionItem
    from datetime import date

    upcoming = Meeting.query.filter(
        Meeting.status.in_(["Scheduled", "InProgress"])
    ).order_by(Meeting.scheduled_time.asc()).all()

    pending_review = Meeting.query.filter_by(status="Closed").all()

    open_actions = ActionItem.query.filter_by(status="Open").all()
    overdue_actions = [a for a in open_actions if a.is_overdue]

    return {
        "upcoming_meetings": [m.to_dict() for m in upcoming],
        "pending_review": [m.to_dict() for m in pending_review],
        "open_action_items": [a.to_dict() for a in open_actions],
        "overdue_action_items": [a.to_dict() for a in overdue_actions],
        "counts": {
            "upcoming": len(upcoming),
            "pending_review": len(pending_review),
            "open_actions": len(open_actions),
            "overdue_actions": len(overdue_actions),
        },
    }
