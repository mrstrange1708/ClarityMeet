# ClarityMeet — Agent Context

## Project Overview
Meeting Outcome Tracker — structured accountability system for remote teams. Enforces meeting discipline, state-machine lifecycle, and governed outcomes.

## Architecture
- **Backend**: Python Flask (port 5000) + PostgreSQL (Neon hosted)
- **Frontend**: React + Vite (port 5173/5174, proxies /api to Flask)
- **Database**: Neon PostgreSQL (`postgresql+psycopg://` via psycopg v3)

## Backend Structure (`backend/`)
```
app.py                          # Flask entry point, blueprints, CORS, DB init
models/
  meeting.py                    # Meeting model (lifecycle: Scheduled→InProgress→Closed→Reviewed)
  agenda_item.py                # AgendaItem (topic, time_allocation)
  action_item.py                # ActionItem (description, owner, deadline, status, is_overdue computed)
  review.py                     # Review (summary, outcome_rating 1-5, followup_required, unique per meeting)
services/
  meeting_state_service.py      # Centralized state machine (VALID_TRANSITIONS whitelist)
  meeting_service.py            # Create, start, close (with pre-checks), dashboard stats
  agenda_service.py             # Add/delete agenda (only when Scheduled)
  action_item_service.py        # Create (validates state, owner, future deadline), complete
  review_service.py             # Create (validates Closed, rating<3→followup, one per meeting)
  ai_service.py                 # Stub suggestions (agenda, actions, review summary)
routes/
  meeting_routes.py             # CRUD + state transitions
  agenda_routes.py              # POST/DELETE agenda
  action_routes.py              # POST/PATCH/GET actions
  review_routes.py              # POST review
  dashboard_routes.py           # GET dashboard stats
  ai_routes.py                  # POST AI suggestions
tests/
  conftest.py                   # Pytest fixtures (in-memory SQLite for tests)
  test_state_machine.py         # 7 tests — valid/invalid transitions
  test_api.py                   # 10 tests — lifecycle, closure, actions, reviews, dashboard
.env                            # DATABASE_URL (Neon PostgreSQL)
```

## Frontend Structure (`frontend/`)
```
src/
  App.jsx                       # Router + sidebar layout
  main.jsx                      # Entry point
  index.css                     # Premium dark theme (glassmorphism, cyan/violet)
  services/api.js               # Axios client (relative /api URLs, Vite proxy)
  pages/
    Dashboard.jsx               # Stat cards + upcoming + overdue + pending review
    MeetingsList.jsx             # Filterable list of meetings
    CreateMeeting.jsx            # Form: title, time, duration
    MeetingDetail.jsx            # Full detail: agenda, actions, review, state buttons, AI
vite.config.js                  # Dev proxy: /api → http://127.0.0.1:5000
```

## Key Design Decisions
1. **Overdue is computed, not stored** — `ActionItem.is_overdue` is a Python property
2. **State machine centralized** — single file, whitelist approach
3. **Vite proxy for dev** — eliminates CORS issues entirely
4. **psycopg v3** — modern PostgreSQL driver (not psycopg2)
5. **All business rules server-side** — frontend is a thin display layer

## Running the Project
```bash
# Backend
cd backend && source venv/bin/activate && python app.py

# Frontend
cd frontend && npm run dev
```

## Running Tests
```bash
cd backend && source venv/bin/activate && python -m pytest tests/ -v
# Result: 17/17 tests pass
```

## What Was Built (Session Log)
1. Created full backend: models, services, routes, tests
2. Created full frontend: API client, 4 pages, premium dark CSS
3. Fixed psycopg v3 compatibility (Python 3.14)
4. Fixed CORS via Vite proxy approach
5. Verified: 17/17 tests pass, browser lifecycle works end-to-end
