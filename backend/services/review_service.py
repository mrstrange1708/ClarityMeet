"""Review business logic service."""

import logging

from models import db, Review
from services.meeting_service import get_meeting, mark_reviewed

logger = logging.getLogger(__name__)


def create_review(
    meeting_id: int, summary: str, outcome_rating: int, followup_required: bool
) -> Review:
    """Create a review for a closed meeting.

    Rules:
        - Meeting must be Closed
        - Only one review per meeting
        - Rating 1-5
        - If rating < 3 → followup_required must be True
    """
    meeting = get_meeting(meeting_id)

    if meeting.status != "Closed":
        raise ValueError(
            f"Cannot review a meeting with status '{meeting.status}'. "
            "Meeting must be Closed."
        )

    if meeting.review is not None:
        raise ValueError("This meeting already has a review.")

    if not summary or not summary.strip():
        raise ValueError("Summary is required.")

    if outcome_rating not in (1, 2, 3, 4, 5):
        raise ValueError("Outcome rating must be between 1 and 5.")

    if outcome_rating < 3 and not followup_required:
        raise ValueError(
            "Follow-up is required when outcome rating is below 3."
        )

    review = Review(
        meeting_id=meeting_id,
        summary=summary.strip(),
        outcome_rating=outcome_rating,
        followup_required=followup_required,
    )
    db.session.add(review)
    db.session.commit()

    # Transition meeting to Reviewed
    mark_reviewed(meeting_id)

    logger.info(
        "Review created for meeting %s: rating=%s followup=%s",
        meeting_id,
        outcome_rating,
        followup_required,
    )
    return review
