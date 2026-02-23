"""Tests for meeting state machine."""

from services.meeting_state_service import validate_transition, can_transition
import pytest


def test_valid_transitions():
    """All valid transitions should pass."""
    validate_transition("Scheduled", "InProgress")
    validate_transition("InProgress", "Closed")
    validate_transition("Closed", "Reviewed")


def test_skip_state():
    """Cannot skip states (Scheduled → Closed)."""
    with pytest.raises(ValueError, match="Invalid transition"):
        validate_transition("Scheduled", "Closed")


def test_reverse_state():
    """Cannot reverse states (InProgress → Scheduled)."""
    with pytest.raises(ValueError, match="Invalid transition"):
        validate_transition("InProgress", "Scheduled")


def test_jump_to_reviewed():
    """Cannot jump directly to Reviewed."""
    with pytest.raises(ValueError, match="Invalid transition"):
        validate_transition("Scheduled", "Reviewed")
    with pytest.raises(ValueError, match="Invalid transition"):
        validate_transition("InProgress", "Reviewed")


def test_no_transition_from_reviewed():
    """Reviewed is terminal — no transitions allowed."""
    with pytest.raises(ValueError, match="Invalid transition"):
        validate_transition("Reviewed", "Scheduled")


def test_can_transition_helper():
    assert can_transition("Scheduled", "InProgress") is True
    assert can_transition("Scheduled", "Closed") is False


def test_unknown_state():
    with pytest.raises(ValueError, match="Unknown current state"):
        validate_transition("InvalidState", "InProgress")
