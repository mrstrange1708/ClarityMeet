# ClarityMeet

# **Meeting Outcome Tracker**

## **Low-Level Design (LLD)**

---

# **1. System Architecture (Backend-Focused)**

```yaml
/app
    /models
    /services
    /routes
    /validators
    /schemas
    /tests
```

Principle:

- Routes handle HTTP only.
- Services handle business logic.
- Models map to database.
- Validators enforce input safety.
- State machine logic centralized.

---

# **2. Database Schema Design**

Relational database (PostgreSQL / SQLite for simplicity).

---

## **2.1 Table: meetings**

| **Field** | **Type** | **Constraints** |
| --- | --- | --- |
| id | UUID / INT | Primary Key |
| title | VARCHAR | NOT NULL |
| scheduled_time | DATETIME | NOT NULL |
| duration_minutes | INT | NOT NULL, > 0 |
| status | ENUM | Scheduled / InProgress / Closed / Reviewed |
| created_at | DATETIME | NOT NULL |
| closed_at | DATETIME | Nullable |

Constraints:

- status default = Scheduled
- duration_minutes must be positive

---

## **2.2 Table: agenda_items**

| **Field** | **Type** | **Constraints** |
| --- | --- | --- |
| id | PK |  |
| meeting_id | FK | NOT NULL |
| description | TEXT | NOT NULL |
| owner | VARCHAR | NOT NULL |
| deadline | DATE | NOT NULL |
| status | ENUM | Open / Completed |
| created_at | DATETIME | NOT NULL |

Overdue is derived — not stored.

---

## **2.4 Table: reviews**

| **Field** | **Type** | **Constraints** |
| --- | --- | --- |
| id | PK |  |
| meeting_id | FK | UNIQUE |
| summary | TEXT | NOT NULL |
| outcome_rating | INT | 1–5 |
| followup_required | BOOLEAN | NOT NULL |

Constraint:

- Only one review per meeting.

---

# **3. State Machine Design**

Meeting lifecycle transitions:

```yaml
Scheduled → InProgress → Closed → Reviewed
```

Allowed Transitions:

| **From** | **To** |
| --- | --- |
| Scheduled | InProgress |
| InProgress | Closed |
| Closed | Reviewed |

Invalid transitions must raise error.

State transition logic handled in:

```yaml
services/meeting_state_service.py
```

Single responsibility:

- Validate current state
- Validate business rules
- Perform state change

---

# **4. Validation Layer**

All request inputs validated using schemas (Marshmallow / Pydantic).

Validation categories:

1. Structural validation (schema)
2. Business rule validation (service layer)

Example:

Creating Action Item:

- owner required
- deadline required
- deadline must be future

Closing Meeting:

- Must have ≥ 1 action item
- All action items must have valid owner and deadline

---

# **5. Business Logic Services**

## **5.1 MeetingService**

Responsibilities:

- Create meeting
- Update meeting
- Trigger state transition
- Validate closure readiness

Key method:

```yaml
close_meeting(meeting_id)
```

Internal checks:

- Meeting status must be InProgress
- At least 1 action item exists
- No action item missing owner or deadline

---

## **5.2 ActionItemService**

Responsibilities:

- Create action item
- Mark completed
- Detect overdue

Overdue calculation:

```yaml
if today > deadline AND status != Completed → Overdue
```

This logic remains server-side only.

---

## **5.3 ReviewService**

Responsibilities:

- Add review
- Validate rating rules

Rule:

If outcome_rating < 3 → followup_required must be true

---

# **6. API Endpoints**

## **Meetings**

POST /meetings

GET /meetings

GET /meetings/{id}

PATCH /meetings/{id}/start

PATCH /meetings/{id}/close

PATCH /meetings/{id}/review

---

## **Agenda**

POST /meetings/{id}/agenda

DELETE /agenda/{id}

---

## **Action Items**

POST /meetings/{id}/actions

PATCH /actions/{id}/complete

GET /meetings/{id}/actions

---

## **Reviews**

POST /meetings/{id}/review

---

# **7. Overdue Detection Strategy**

Two approaches:

Option A (Simpler):

- Compute overdue dynamically in query.

Option B:

- Background check when dashboard loads.


Use dynamic computation.

---

# **8. Logging & Observability**

Log events:

- Meeting created
- State transition attempts
- Invalid transition blocked
- Meeting closed
- Action item completed
- Overdue detected

Logs must include:

- meeting_id
- timestamp
- previous_state
- next_state

---

# **9. Testing Strategy**

Minimum meaningful test coverage:

1. Cannot close meeting without action items.
2. Cannot skip state transitions.
3. Cannot create action item without owner.
4. Overdue detection works.
5. Cannot review unclosed meeting.

Focus on business rule tests, not UI tests.

---

# **10. AI Integration Design**

AI interaction must be isolated:

/services/ai_service.py

Rules:

- AI cannot change meeting status.
- AI suggestions must pass validation.
- AI outputs treated as untrusted input.

Guidance file:

- Define boundaries clearly.
- Define formatting constraints.
- Forbid modifying system state directly.

---

# **11. Frontend Structure (React)**

```yaml
/pages
/components
/services (API layer)
/hooks
```

Pages:

- Dashboard
- Meetings List
- Meeting Detail
- Create Meeting

Frontend must:

- Display backend validation errors clearly.
- Not enforce business rules independently.
- Treat backend as source of truth.

---

# **12. Key Engineering Decision**

Overdue is computed, not stored.

Reason:

- Prevents state inconsistency.
- Ensures single source of truth.
- Improves change resilience.

---

# **13. Core Invariant of Entire System**

A meeting cannot be considered complete unless it produces owned, time-bound, and validated action items.

Everything revolves around this.