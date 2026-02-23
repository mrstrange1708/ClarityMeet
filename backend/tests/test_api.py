"""Integration tests for the full meeting lifecycle via API."""

import json
from datetime import datetime, timedelta


def _future_time(hours=1):
    return (datetime.utcnow() + timedelta(hours=hours)).isoformat()


def _future_date(days=7):
    return (datetime.utcnow() + timedelta(days=days)).date().isoformat()


class TestMeetingLifecycle:
    """Happy-path: create → agenda → start → actions → close → review."""

    def test_full_lifecycle(self, client):
        # 1. Create meeting
        res = client.post(
            "/api/meetings",
            json={
                "title": "Sprint Planning",
                "scheduled_time": _future_time(),
                "duration_minutes": 60,
            },
        )
        assert res.status_code == 201
        meeting = json.loads(res.data)
        mid = meeting["id"]
        assert meeting["status"] == "Scheduled"

        # 2. Add agenda
        res = client.post(
            f"/api/meetings/{mid}/agenda",
            json={"topic": "Review backlog", "time_allocation": 20},
        )
        assert res.status_code == 201

        # 3. Start meeting
        res = client.patch(f"/api/meetings/{mid}/start")
        assert res.status_code == 200
        assert json.loads(res.data)["status"] == "InProgress"

        # 4. Add action item
        res = client.post(
            f"/api/meetings/{mid}/actions",
            json={
                "description": "Update roadmap",
                "owner": "Alice",
                "deadline": _future_date(),
            },
        )
        assert res.status_code == 201

        # 5. Close meeting
        res = client.patch(f"/api/meetings/{mid}/close")
        assert res.status_code == 200
        data = json.loads(res.data)
        assert data["status"] == "Closed"
        assert data["closed_at"] is not None

        # 6. Review meeting
        res = client.post(
            f"/api/meetings/{mid}/review",
            json={
                "summary": "Good sprint planning session.",
                "outcome_rating": 4,
                "followup_required": False,
            },
        )
        assert res.status_code == 201

        # 7. Verify final state
        res = client.get(f"/api/meetings/{mid}")
        assert json.loads(res.data)["status"] == "Reviewed"


class TestClosureRules:
    """Meeting closure must enforce action item requirements."""

    def test_close_without_actions_fails(self, client):
        res = client.post(
            "/api/meetings",
            json={
                "title": "Empty Meeting",
                "scheduled_time": _future_time(),
                "duration_minutes": 30,
            },
        )
        mid = json.loads(res.data)["id"]
        client.patch(f"/api/meetings/{mid}/start")

        res = client.patch(f"/api/meetings/{mid}/close")
        assert res.status_code == 400
        assert "action item" in json.loads(res.data)["error"].lower()

    def test_close_from_scheduled_fails(self, client):
        res = client.post(
            "/api/meetings",
            json={
                "title": "Not started",
                "scheduled_time": _future_time(),
                "duration_minutes": 30,
            },
        )
        mid = json.loads(res.data)["id"]

        res = client.patch(f"/api/meetings/{mid}/close")
        assert res.status_code == 400
        assert "Invalid transition" in json.loads(res.data)["error"]


class TestActionItemValidation:
    """Action items must have owner, deadline in the future."""

    def test_action_without_owner_fails(self, client):
        res = client.post(
            "/api/meetings",
            json={
                "title": "Test Meeting",
                "scheduled_time": _future_time(),
                "duration_minutes": 30,
            },
        )
        mid = json.loads(res.data)["id"]
        client.patch(f"/api/meetings/{mid}/start")

        res = client.post(
            f"/api/meetings/{mid}/actions",
            json={
                "description": "Task",
                "owner": "",
                "deadline": _future_date(),
            },
        )
        assert res.status_code == 400
        assert "owner" in json.loads(res.data)["error"].lower()

    def test_action_with_past_deadline_fails(self, client):
        res = client.post(
            "/api/meetings",
            json={
                "title": "Test Meeting",
                "scheduled_time": _future_time(),
                "duration_minutes": 30,
            },
        )
        mid = json.loads(res.data)["id"]
        client.patch(f"/api/meetings/{mid}/start")

        res = client.post(
            f"/api/meetings/{mid}/actions",
            json={
                "description": "Task",
                "owner": "Bob",
                "deadline": "2020-01-01",
            },
        )
        assert res.status_code == 400
        assert "future" in json.loads(res.data)["error"].lower()


class TestReviewRules:
    """Review enforcement rules."""

    def _create_closeable_meeting(self, client):
        res = client.post(
            "/api/meetings",
            json={
                "title": "Reviewable Meeting",
                "scheduled_time": _future_time(),
                "duration_minutes": 30,
            },
        )
        mid = json.loads(res.data)["id"]
        client.patch(f"/api/meetings/{mid}/start")
        client.post(
            f"/api/meetings/{mid}/actions",
            json={
                "description": "Do something",
                "owner": "Alice",
                "deadline": _future_date(),
            },
        )
        client.patch(f"/api/meetings/{mid}/close")
        return mid

    def test_review_unclosed_fails(self, client):
        res = client.post(
            "/api/meetings",
            json={
                "title": "Open Meeting",
                "scheduled_time": _future_time(),
                "duration_minutes": 30,
            },
        )
        mid = json.loads(res.data)["id"]

        res = client.post(
            f"/api/meetings/{mid}/review",
            json={
                "summary": "Test",
                "outcome_rating": 4,
                "followup_required": False,
            },
        )
        assert res.status_code == 400

    def test_low_rating_requires_followup(self, client):
        mid = self._create_closeable_meeting(client)

        res = client.post(
            f"/api/meetings/{mid}/review",
            json={
                "summary": "Bad meeting",
                "outcome_rating": 2,
                "followup_required": False,
            },
        )
        assert res.status_code == 400
        assert "follow-up" in json.loads(res.data)["error"].lower()

    def test_low_rating_with_followup_succeeds(self, client):
        mid = self._create_closeable_meeting(client)

        res = client.post(
            f"/api/meetings/{mid}/review",
            json={
                "summary": "Bad meeting — needs followup",
                "outcome_rating": 2,
                "followup_required": True,
            },
        )
        assert res.status_code == 201


class TestDashboard:
    def test_dashboard_returns_data(self, client):
        res = client.get("/api/dashboard")
        assert res.status_code == 200
        data = json.loads(res.data)
        assert "counts" in data
        assert "upcoming_meetings" in data


class TestAgendaRules:
    def test_cannot_add_agenda_after_start(self, client):
        res = client.post(
            "/api/meetings",
            json={
                "title": "Test",
                "scheduled_time": _future_time(),
                "duration_minutes": 30,
            },
        )
        mid = json.loads(res.data)["id"]
        client.patch(f"/api/meetings/{mid}/start")

        res = client.post(
            f"/api/meetings/{mid}/agenda",
            json={"topic": "Late topic", "time_allocation": 10},
        )
        assert res.status_code == 400
        assert "agenda" in json.loads(res.data)["error"].lower()
