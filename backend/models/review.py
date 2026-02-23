from datetime import datetime, timezone
from models import db


class Review(db.Model):
    __tablename__ = "reviews"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    meeting_id = db.Column(
        db.Integer,
        db.ForeignKey("meetings.id"),
        nullable=False,
        unique=True,  # One review per meeting
    )
    summary = db.Column(db.Text, nullable=False)
    outcome_rating = db.Column(db.Integer, nullable=False)  # 1-5
    followup_required = db.Column(db.Boolean, nullable=False)
    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "meeting_id": self.meeting_id,
            "summary": self.summary,
            "outcome_rating": self.outcome_rating,
            "followup_required": self.followup_required,
            "created_at": self.created_at.isoformat(),
        }
