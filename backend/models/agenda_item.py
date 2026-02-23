from datetime import datetime, timezone
from models import db


class AgendaItem(db.Model):
    __tablename__ = "agenda_items"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    meeting_id = db.Column(
        db.Integer, db.ForeignKey("meetings.id"), nullable=False
    )
    topic = db.Column(db.Text, nullable=False)
    time_allocation = db.Column(db.Integer, nullable=False)  # minutes
    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "meeting_id": self.meeting_id,
            "topic": self.topic,
            "time_allocation": self.time_allocation,
            "created_at": self.created_at.isoformat(),
        }
