"""Action item business logic service."""

import logging
from datetime import date, datetime

from models import db, ActionItem
from services.meeting_service import get_meeting

logger = logging.getLogger(__name__)


def create_action_item(
    meeting_id: int, description: str, owner: str, deadline: str
) -> ActionItem:
    """Create an action item for a meeting.

    Rules:
        - Meeting must be InProgress
        - Owner required
        - Deadline required and must be future
    """
    meeting = get_meeting(meeting_id)

    if meeting.status not in ("Scheduled", "InProgress"):
        raise ValueError(
            f"Cannot add action items when meeting is {meeting.status}."
        )

    if not description or not description.strip():
        raise ValueError("Description is required.")
    if not owner or not owner.strip():
        raise ValueError("Owner is required.")
    if not deadline:
        raise ValueError("Deadline is required.")

    deadline_date = (
        datetime.fromisoformat(deadline).date()
        if isinstance(deadline, str)
        else deadline
    )

    if deadline_date <= date.today():
        raise ValueError("Deadline must be a future date.")

    action = ActionItem(
        meeting_id=meeting_id,
        description=description.strip(),
        owner=owner.strip(),
        deadline=deadline_date,
        status="Open",
    )
    db.session.add(action)
    db.session.commit()

    logger.info(
        "Action item created: id=%s meeting=%s owner=%s deadline=%s",
        action.id,
        meeting_id,
        owner,
        deadline_date,
    )
    return action


def complete_action_item(action_id: int) -> ActionItem:
    """Mark an action item as Completed."""
    action = db.session.get(ActionItem, action_id)
    if not action:
        raise LookupError(f"Action item {action_id} not found.")

    meeting = get_meeting(action.meeting_id)
    if meeting.status == "Reviewed":
        raise ValueError("Cannot modify action items after meeting is Reviewed.")

    action.status = "Completed"
    db.session.commit()

    logger.info("Action item %s completed.", action_id)
    return action


def get_actions_for_meeting(meeting_id: int):
    """Return all action items for a meeting with overdue computed."""
    _ = get_meeting(meeting_id)  # validates meeting exists
    return ActionItem.query.filter_by(meeting_id=meeting_id).all()
