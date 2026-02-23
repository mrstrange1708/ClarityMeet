# ClarityMeet

A full-stack **Meeting Outcome Tracker** that enforces structured accountability for professional meetings — agenda-driven, actionable outcomes, explicit ownership, enforced deadlines, and mandatory reviews.

---

## Features

### Meeting Lifecycle Management
- **State Machine** — Meetings follow a strict lifecycle: `Scheduled → In Progress → Closed → Reviewed`
- Invalid state transitions are rejected at the API level (e.g., cannot skip from Scheduled to Closed)
- All business rules enforced server-side

### Agenda Management
- Add/remove agenda items with time allocations (only while meeting is Scheduled)
- Track total allocated time across all agenda topics
- AI-powered agenda suggestions based on meeting title

### Action Items
- Create action items with **required owner** and **future deadline**
- Mark items as complete at any stage
- **Dynamic overdue detection** — computed in real-time, never stored in DB
- AI-powered action item suggestions based on agenda topics

### Meeting Closure Rules
- Cannot close without at least **one action item**
- Every action item must have an **owner** and a **deadline**
- Ensures no meeting ends without accountability

### Review & Accountability
- Reviews can only be submitted for **Closed** meetings
- **One review per meeting** (enforced via unique constraint)
- Star rating system (1–5)
- Rating below 3 **requires follow-up** (enforced by backend)
- AI-powered review summary generation

### Dashboard
- Upcoming meetings count
- Open action items count
- Overdue items count
- Pending reviews count
- Quick-access lists for upcoming meetings, overdue items, and meetings needing review

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19 + Vite |
| **Styling** | Vanilla CSS (dark theme) |
| **Icons** | Lucide React |
| **Backend** | Python Flask |
| **Database** | PostgreSQL (Neon) |
| **ORM** | SQLAlchemy + Flask-SQLAlchemy |
| **Driver** | psycopg v3 |
| **Testing** | pytest (17 tests) |

---

## Project Structure

```
ClarityMeet/
├── backend/
│   ├── app.py                    # Flask entry point
│   ├── .env                      # Database URL & config
│   ├── requirements.txt
│   ├── models/
│   │   ├── meeting.py            # Meeting model
│   │   ├── agenda_item.py        # AgendaItem model
│   │   ├── action_item.py        # ActionItem model (with computed is_overdue)
│   │   └── review.py             # Review model (unique per meeting)
│   ├── services/
│   │   ├── meeting_state_service.py  # Centralized state machine
│   │   ├── meeting_service.py        # Meeting CRUD + dashboard stats
│   │   ├── agenda_service.py         # Agenda add/delete
│   │   ├── action_item_service.py    # Action item CRUD + validation
│   │   ├── review_service.py         # Review creation + enforcement
│   │   └── ai_service.py            # AI suggestion stubs
│   ├── routes/
│   │   ├── meeting_routes.py     # /api/meetings
│   │   ├── agenda_routes.py      # /api/meetings/:id/agenda
│   │   ├── action_routes.py      # /api/meetings/:id/actions
│   │   ├── review_routes.py      # /api/meetings/:id/review
│   │   ├── dashboard_routes.py   # /api/dashboard
│   │   └── ai_routes.py          # /api/ai/*
│   └── tests/
│       ├── conftest.py           # Pytest fixtures (in-memory SQLite)
│       ├── test_state_machine.py # State transition tests
│       └── test_api.py           # API integration tests
├── frontend/
│   ├── vite.config.js            # Dev proxy to Flask
│   ├── src/
│   │   ├── App.jsx               # Router + sidebar layout
│   │   ├── main.jsx              # Entry point
│   │   ├── index.css             # Dark + white design system
│   │   ├── services/api.js       # Axios API client
│   │   └── pages/
│   │       ├── Dashboard.jsx     # Stats + upcoming + overdue
│   │       ├── MeetingsList.jsx  # Filterable meeting list
│   │       ├── CreateMeeting.jsx # New meeting form
│   │       └── MeetingDetail.jsx # Full meeting view
├── HLD.md                        # High-level design
├── LLD.md                        # Low-level design
└── README.md
```

---

## Prerequisites

- **Python 3.10+**
- **Node.js 18+**
- **PostgreSQL** database (or a hosted service like [Neon](https://neon.tech))

---

## Setup

### 1. Clone the Repository

```bash
git clone https://github.com/mrstrange1708/ClarityMeet.git
cd ClarityMeet
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate   # macOS/Linux
# venv\Scripts\activate    # Windows

# Install dependencies
pip install -r requirements.txt
```

### 3. Configure Environment Variables

Create a `.env` file in `backend/`:

```env
DATABASE_URL=postgresql://username:password@host/database?sslmode=require
FLASK_ENV=development
FLASK_DEBUG=1
```

Replace the `DATABASE_URL` with your PostgreSQL connection string.

### 4. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install
```

---

## Running the Application

Open **two terminals**:

**Terminal 1 — Backend (Flask on port 7777):**
```bash
cd backend
source venv/bin/activate
python app.py
```

**Terminal 2 — Frontend (Vite on port 5173):**
```bash
cd frontend
npm run dev
```

Open **http://localhost:5173** in your browser.

> The Vite dev server proxies all `/api` requests to the Flask backend automatically.

---

## Running Tests

```bash
cd backend
source venv/bin/activate
python -m pytest tests/ -v
```

**Result: 17/17 tests passing**

Tests cover:
- State machine transitions (valid + invalid)
- Full meeting lifecycle via API
- Closure rules (requires action items with owners/deadlines)
- Action item validation (owner required, future deadline)
- Review enforcement (must be Closed, one per meeting, rating < 3 requires follow-up)
- Dashboard data aggregation
- Agenda modification restrictions

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/meetings` | Create a meeting |
| `GET` | `/api/meetings` | List meetings (optional `?status=` filter) |
| `GET` | `/api/meetings/:id` | Get meeting details |
| `POST` | `/api/meetings/:id/start` | Start a scheduled meeting |
| `POST` | `/api/meetings/:id/close` | Close an in-progress meeting |
| `POST` | `/api/meetings/:id/agenda` | Add agenda item |
| `DELETE` | `/api/agenda/:id` | Delete agenda item |
| `POST` | `/api/meetings/:id/actions` | Create action item |
| `PATCH` | `/api/actions/:id/complete` | Mark action item complete |
| `GET` | `/api/meetings/:id/actions` | List action items |
| `POST` | `/api/meetings/:id/review` | Submit review |
| `GET` | `/api/dashboard` | Dashboard statistics |
| `POST` | `/api/ai/suggest-agenda` | AI agenda suggestions |
| `POST` | `/api/ai/suggest-actions` | AI action item suggestions |
| `POST` | `/api/ai/summarize-review` | AI review summary |

---

## Design Decisions

1. **Backend as source of truth** — All business rules enforced server-side; frontend is a thin display layer
2. **Overdue is computed, not stored** — `ActionItem.is_overdue` is a Python property, ensuring consistency
3. **State machine centralized** — Single file, whitelist-based transitions
4. **AI is advisory only** — Suggestions must pass backend validation before persisting
5. **Vite proxy for development** — Eliminates CORS issues entirely during dev

---

## License

MIT
