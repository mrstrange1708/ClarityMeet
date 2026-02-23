from datetime import datetime, date, timezone
from models import db


class ActionItem(db.Model):
    __tablename__ = "action_items"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    meeting_id = db.Column(
        db.Integer, db.ForeignKey("meetings.id"), nullable=False
    )
    description = db.Column(db.Text, nullable=False)
    owner = db.Column(db.String(255), nullable=False)
    deadline = db.Column(db.Date, nullable=False)
    status = db.Column(db.String(20), nullable=False, default="Open")
    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    @property
    def is_overdue(self) -> bool:
        """Overdue is computed dynamically — never stored."""
        return self.status != "Completed" and self.deadline < date.today()

    def to_dict(self):
        return {
            "id": self.id,
            "meeting_id": self.meeting_id,
            "description": self.description,
            "owner": self.owner,
            "deadline": self.deadline.isoformat(),
            "status": self.status,
            "is_overdue": self.is_overdue,
            "created_at": self.created_at.isoformat(),
        }
