"""Agenda item business logic service."""

import logging

from models import db, AgendaItem
from services.meeting_service import get_meeting

logger = logging.getLogger(__name__)


def add_agenda_item(meeting_id: int, topic: str, time_allocation: int) -> AgendaItem:
    """Add an agenda item to a meeting.

    Rules:
        - Meeting must be Scheduled (cannot add once started)
        - Topic required
        - Time allocation must be positive
        - Total agenda time cannot exceed meeting duration
    """
    meeting = get_meeting(meeting_id)

    if meeting.status != "Scheduled":
        raise ValueError(
            f"Cannot modify agenda when meeting is {meeting.status}. "
            "Agenda can only be added when meeting is Scheduled."
        )

    if not topic or not topic.strip():
        raise ValueError("Topic is required.")

    if time_allocation is None or time_allocation <= 0:
        raise ValueError("Time allocation must be a positive integer.")

    # Check total agenda time doesn't exceed meeting duration
    current_total = sum(a.time_allocation for a in meeting.agenda_items)
    if current_total + time_allocation > meeting.duration_minutes:
        remaining = meeting.duration_minutes - current_total
        raise ValueError(
            f"Cannot add {time_allocation} min — only {remaining} min remaining "
            f"out of {meeting.duration_minutes} min meeting."
        )

    item = AgendaItem(
        meeting_id=meeting_id,
        topic=topic.strip(),
        time_allocation=time_allocation,
    )
    db.session.add(item)
    db.session.commit()

    logger.info(
        "Agenda item added: id=%s meeting=%s topic=%s",
        item.id,
        meeting_id,
        topic,
    )
    return item


def update_agenda_item(item_id: int, time_allocation: int) -> AgendaItem:
    """Update an agenda item's time allocation.

    Rules:
        - Meeting must be Scheduled
        - Time allocation must be positive
        - Total agenda time cannot exceed meeting duration
    """
    item = db.session.get(AgendaItem, item_id)
    if not item:
        raise LookupError(f"Agenda item {item_id} not found.")

    meeting = get_meeting(item.meeting_id)
    if meeting.status != "Scheduled":
        raise ValueError(
            f"Cannot modify agenda when meeting is {meeting.status}."
        )

    if time_allocation is None or time_allocation <= 0:
        raise ValueError("Time allocation must be a positive integer.")

    # Check total (excluding this item) + new value doesn't exceed duration
    other_total = sum(
        a.time_allocation for a in meeting.agenda_items if a.id != item_id
    )
    if other_total + time_allocation > meeting.duration_minutes:
        remaining = meeting.duration_minutes - other_total
        raise ValueError(
            f"Cannot set {time_allocation} min — only {remaining} min remaining "
            f"out of {meeting.duration_minutes} min meeting."
        )

    item.time_allocation = time_allocation
    db.session.commit()

    logger.info("Agenda item %s updated to %s min.", item_id, time_allocation)
    return item


def delete_agenda_item(item_id: int) -> None:
    """Delete an agenda item.

    Rules:
        - Meeting must be Scheduled
    """
    item = db.session.get(AgendaItem, item_id)
    if not item:
        raise LookupError(f"Agenda item {item_id} not found.")

    meeting = get_meeting(item.meeting_id)
    if meeting.status != "Scheduled":
        raise ValueError(
            f"Cannot modify agenda when meeting is {meeting.status}."
        )

    db.session.delete(item)
    db.session.commit()
    logger.info("Agenda item %s deleted.", item_id)
