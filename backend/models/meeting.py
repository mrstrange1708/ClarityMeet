from datetime import datetime, timezone
from models import db


class Meeting(db.Model):
    __tablename__ = "meetings"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    title = db.Column(db.String(255), nullable=False)
    scheduled_time = db.Column(db.DateTime(timezone=True), nullable=False)
    duration_minutes = db.Column(db.Integer, nullable=False)
    status = db.Column(
        db.String(20),
        nullable=False,
        default="Scheduled",
    )
    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    closed_at = db.Column(db.DateTime(timezone=True), nullable=True)

    # Relationships
    agenda_items = db.relationship(
        "AgendaItem", backref="meeting", cascade="all, delete-orphan", lazy=True
    )
    action_items = db.relationship(
        "ActionItem", backref="meeting", cascade="all, delete-orphan", lazy=True
    )
    review = db.relationship(
        "Review", backref="meeting", uselist=False, cascade="all, delete-orphan"
    )

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "scheduled_time": self.scheduled_time.isoformat(),
            "duration_minutes": self.duration_minutes,
            "status": self.status,
            "created_at": self.created_at.isoformat(),
            "closed_at": self.closed_at.isoformat() if self.closed_at else None,
            "agenda_items": [a.to_dict() for a in self.agenda_items],
            "action_items": [a.to_dict() for a in self.action_items],
            "review": self.review.to_dict() if self.review else None,
        }
