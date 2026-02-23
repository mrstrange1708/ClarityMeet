"""
Centralized Meeting State Machine.

Valid transitions:
    Scheduled  → InProgress
    InProgress → Closed
    Closed     → Reviewed

All other transitions are rejected.
"""

import logging

logger = logging.getLogger(__name__)

VALID_TRANSITIONS = {
    "Scheduled": ["InProgress"],
    "InProgress": ["Closed"],
    "Closed": ["Reviewed"],
    "Reviewed": [],
}

ALL_STATES = list(VALID_TRANSITIONS.keys())


def validate_transition(current_state: str, target_state: str) -> None:
    """Raise ValueError if the transition is not allowed."""
    if current_state not in VALID_TRANSITIONS:
        logger.warning(
            "Invalid current state: %s (attempted → %s)", current_state, target_state
        )
        raise ValueError(f"Unknown current state: {current_state}")

    allowed = VALID_TRANSITIONS[current_state]
    if target_state not in allowed:
        logger.warning(
            "Blocked transition: %s → %s (allowed: %s)",
            current_state,
            target_state,
            allowed,
        )
        raise ValueError(
            f"Invalid transition: {current_state} → {target_state}. "
            f"Allowed: {', '.join(allowed) if allowed else 'none'}"
        )

    logger.info("State transition approved: %s → %s", current_state, target_state)


def can_transition(current_state: str, target_state: str) -> bool:
    """Return True if the transition is valid, False otherwise."""
    try:
        validate_transition(current_state, target_state)
        return True
    except ValueError:
        return False
