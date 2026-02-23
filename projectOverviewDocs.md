# ClarityMeet
### Architecture, Structure, Technical Decisions, AI Usage, Risks & Extensions


---

## 1. Introduction & Problem Statement

> "Meetings are where decisions happen, but outcomes go untracked. ClarityMeet enforces structured accountability for every meeting."

**The Problem:**
- Meeting outcomes aren't tracked. People leave meetings without clear action items
- No system enforces that every action item has an **owner** and a **deadline**
- Meetings close without review, decisions fade from memory
- Action item overdue status is often manually tracked and inaccurate

**Our Solution:**
ClarityMeet is a **full-stack Meeting Outcome Tracker** built with Flask + React that enforces a strict **meeting lifecycle state machine** — from scheduling through review — with mandatory accountability checkpoints at every stage.

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│     React SPA (Vite)          ← Frontend            │
│     └── Axios (/api)                                │
│           │                                         │
│           ▼  [Vite Proxy in dev / Vercel in prod]   │
│                                                     │
│     Flask REST API            ← Backend             │
│     ├── Routes (controllers)                        │
│     ├── Services (business logic)                   │
│     │   ├── State Machine                           │
│     │   ├── Validation Layer                        │
│     │   └── AI Service (advisory only)              │
│     └── Models (SQLAlchemy ORM)                     │
│           │                                         │
│           ▼                                         │
│     PostgreSQL (Neon)         ← Database            │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Architecture Pattern:
- **Layered Architecture** — strict separation between Routes → Services → Models
- Routes handle HTTP concerns (parsing, status codes)
- Services contain all business logic and validation
- Models are pure data representations with serialization

### Why This Pattern:
- Routes never contain business logic → easy to test services in isolation
- Services don't know about HTTP (no request/response objects) → reusable
- Models don't know about validation rules → clean separation

---

## 3. Data Model & Relationships

### Entity Relationship Diagram:

```
┌──────────────┐        ┌──────────────┐
│   Meeting    │───1:N──│  AgendaItem  │
│──────────────│        │──────────────│
│ id           │        │ id           │
│ title        │        │ meeting_id   │← FK
│ scheduled_time│       │ topic        │
│ duration_min │        │ time_alloc   │
│ status       │        └──────────────┘
│ created_at   │
│ closed_at    │        ┌──────────────┐
│              │───1:N──│  ActionItem  │
│              │        │──────────────│
│              │        │ id           │
│              │        │ meeting_id   │← FK
│              │        │ description  │
│              │        │ owner        │← Required
│              │        │ deadline     │← Required, Must be future
│              │        │ status       │
│              │        │ is_overdue   │← @property (computed)
│              │        └──────────────┘
│              │
│              │        ┌──────────────┐
│              │───1:1──│   Review     │
│              │        │──────────────│
│              │        │ id           │
└──────────────┘        │ meeting_id   │← FK + UNIQUE
                        │ summary      │
                        │ outcome_rating│← 1-5
                        │ followup_req │← Auto if rating < 3
                        └──────────────┘
```

### Key Design Decision — `is_overdue` is a Python `@property`:
```python
@property
def is_overdue(self) -> bool:
    """Overdue is computed dynamically — never stored."""
    return self.status != "Completed" and self.deadline < date.today()
```

**Why not store it in the database?**
- If stored, it would go **stale overnight** without a cron/scheduled job
- As a computed property, it's always **correct in real-time**
- No scheduled tasks, no cache invalidation — zero maintenance overhead
- Trade-off: slight CPU cost per request, but negligible for our scale

---

## 4. State Machine — The Core Technical Decision

### The Meeting Lifecycle:

```
┌───────────┐     Start     ┌────────────┐     Close     ┌────────┐     Review    ┌──────────┐
│ Scheduled │──────────────→│ InProgress │──────────────→│ Closed │─────────────→│ Reviewed │
└───────────┘               └────────────┘               └────────┘              └──────────┘
      │                           │                           │                        │
      │ Can: add agenda           │ Can: add actions          │ Can: write review      │ Terminal
      │ Can: delete agenda        │ Can: complete actions     │ Must have 1+ actions   │ state
      │ Cannot: add actions       │ Cannot: edit agenda       │ One review only        │
      │ Cannot: start w/o agenda  │ Cannot: skip to Closed    │ Rating < 3 → followup │
```

### Implementation — Whitelist-Based Transitions:
```python
VALID_TRANSITIONS = {
    "Scheduled":  ["InProgress"],
    "InProgress": ["Closed"],
    "Closed":     ["Reviewed"],
    "Reviewed":   [],          # Terminal state — no further transitions
}
```


## 5. Agenda Time Validation

### The Problem:
Users could add 2 × 10-minute agenda items to a 15-minute meeting. No guard existed.

### The Solution — Server-Side Budget Check:
```python
def add_agenda_item(meeting_id, topic, time_allocation):
    current_total = sum(a.time_allocation for a in meeting.agenda_items)
    if current_total + time_allocation > meeting.duration_minutes:
        remaining = meeting.duration_minutes - current_total
        raise ValueError(
            f"Cannot add {time_allocation} min — only {remaining} min remaining "
            f"out of {meeting.duration_minutes} min meeting."
        )
```

**Why server-side, not just frontend?**
- Frontend validation can be bypassed (dev tools, API calls)
- Server is the **single source of truth** — all rules enforced there
- Frontend shows the validation reactively: `"Agenda (20 / 15 min)"`

---

## 6. AI Integration — Advisory Pattern

### Architecture Decision: AI as *Advisor*, Never *Actor*

```
┌──────────────────────────────────────────────────┐
│                   AI Boundary                    │
│                                                  │
│   AI Service outputs suggestions as plain data   │
│   (topic strings, descriptions, ratings)         │
│                                                  │
│   ✗ AI CANNOT: modify meeting state              │
│   ✗ AI CANNOT: assign owners or deadlines        │
│   ✗ AI CANNOT: create/update/delete records      │
│   ✗ AI CANNOT: bypass validation rules           │
│                                                  │
│   ✓ AI CAN: suggest agenda topics                │
│   ✓ AI CAN: suggest action items (no owner)      │
│   ✓ AI CAN: generate review summaries            │
│   ✓ User must manually accept + fill in fields   │
│                                                  │
└──────────────────────────────────────────────────┘
```

### Three AI Features:

| Feature | Input | Output | Validation |
|---------|-------|--------|------------|
| **Suggest Agenda** | Meeting title | List of topics + time | Must pass agenda budget check |
| **Suggest Actions** | Title + agenda topics | List of descriptions | User must add owner + deadline |
| **Summarize Review** | Title + action items | Summary text + rating | User must confirm before submit |

### Current Implementation — Stub Service:
```python
def suggest_agenda_topics(title: str) -> list[dict]:
    """In production this would call an LLM."""
    return [
        {"topic": f"Review progress on {title}", "time_allocation": 10},
        {"topic": "Open discussion and blockers", "time_allocation": 10},
        {"topic": "Decisions and next steps", "time_allocation": 10},
    ]
```

### Ready for LLM Integration:
The stub service has the exact same interface the LLM version will use. Swapping in OpenAI/Groq is a **single file change** — replace the stub returns with API calls. No other code changes needed.

### Why This Pattern Matters:
- **AI outputs are untrusted input.** They go through the same validation pipeline as user input
- If AI suggests a 30-min agenda for a 15-min meeting → backend rejects it
- If AI suggests an action without an owner → user must fill it in before closing
- This prevents hallucinated or inappropriate AI suggestions from corrupting data

---

## 7. Frontend Architecture

### Stack:
- **React 19** with React Router for SPA navigation
- **Vite** for dev server + production build
- **Axios** API client with relative `/api` base URL
- **Lucide React** for consistent SVG iconography
- **Vanilla CSS** design system — no utility framework

### Design System:
```css
:root {
  --bg-primary: #09090b;     /* Near-black base */
  --bg-card: #1c1c21;        /* Elevated surfaces */
  --text-primary: #fafafa;   /* White text */
  --accent: #10b981;         /* Emerald green — all CTAs */
  --status-amber: #f59e0b;   /* In-progress state */
  --status-rose: #f43f5e;    /* Overdue / danger */
}
```

### Dev-to-Prod API Strategy:
```
Development:  React → Vite Proxy → localhost:7777 (Flask)
Production:   React → VITE_API_URL env var → Hosted Backend
```

- In dev, `baseURL: '/api'` → Vite proxy forwards to Flask. Zero CORS
- In prod, `VITE_API_URL` is set at build time → baked into the bundle
- No runtime config needed, no CORS headers needed

---

## 8. Testing Strategy

### 17 Automated Tests (pytest):
```
tests/
├── conftest.py           ← In-memory SQLite for speed
├── test_state_machine.py ← Unit tests for state transitions
└── test_api.py           ← Integration tests via Flask test client
```

### What's Tested:

| Category | Tests | What They Verify |
|----------|-------|-----------------|
| State Machine | 5 | Valid transitions approved, invalid rejected |
| Meeting Lifecycle | 3 | Create → Start → Close → Review flow |
| Closure Rules | 3 | Must have actions, must have owner/deadline |
| Action Items | 2 | Owner required, future deadline required |
| Review | 2 | Must be Closed, rating < 3 forces followup |
| Dashboard | 1 | Aggregation stats correct |
| Agenda | 1 | Modification blocked after meeting starts |

### Why In-Memory SQLite?
- **Speed**: ~0.3s for all 17 tests (vs 2-3s with real PostgreSQL)
- **Isolation**: Each test gets a clean database (no data leaks)
- **No infra needed**: CI/CD runs without database setup
- SQLAlchemy's ORM abstracts the dialect → same code, different DB engine

---

## 9. Deployment Architecture

### Current Setup:
```
GitHub (mrstrange1708/ClarityMeet)
    ├── main branch
    │
    ├── Vercel Project: Backend (Root: /backend)
    │   ├── vercel.json → @vercel/python builder
    │   ├── wsgi.py → Flask app entry point
    │   └── Env vars: DATABASE_URL, FLASK_ENV=production
    │
    └── Vercel Project: Frontend (Root: /frontend)
        ├── vercel.json → SPA rewrite rules
        ├── npm run build → dist/
        └── Env vars: VITE_API_URL=https://backend.vercel.app/api
```

### Security:
- `.gitignore` excludes all `.env` files
- `.env.example` files with placeholder values for onboarding
- Database credentials only exist in Vercel's encrypted env vars
- `FLASK_DEBUG=0` and `FLASK_ENV=production` in deployment

---

## 10. Known Risks & Mitigations

| Risk | Severity | Mitigation |
|------|----------|------------|
| **AI hallucination** — AI suggests nonsensical agenda/actions | Medium | AI is advisory only. All suggestions pass backend validation. AI cannot mutate state directly |
| **No authentication** — anyone can access any meeting | High | Current scope is single-tenant. Multi-user auth (JWT/OAuth) is the priority extension |
| **Vercel cold starts** — Python serverless functions have ~2s cold start | Medium | Acceptable for internal tools. Can migrate to Railway/Render for always-on if needed |
| **No pagination** — loading all meetings at once | Low | Fine for <1000 meetings. Would need cursor-based pagination at scale |
| **No WebSocket** — dashboard doesn't auto-refresh | Low | Polling or manual refresh is sufficient. Real-time is a nice-to-have |
| **Single database** — no read replicas | Low | Neon supports read replicas if needed. Current load doesn't warrant it |
| **No rate limiting** — API endpoints open to abuse | Medium | Add Flask-Limiter or deploy behind Cloudflare for rate limiting |

---

## 11. Extension Approach — Future Roadmap

### Phase 1: Authentication & Multi-User
```
- JWT-based auth with Flask-JWT-Extended
- User model with roles (Organizer, Participant, Observer)
- Meeting ownership — only organizer can start/close
- Action item assignment limited to participants
```

### Phase 2: Real LLM Integration
```
- Replace ai_service.py stub with OpenAI/Groq API calls
- Add prompt engineering for context-aware suggestions
- Meeting transcript input for automatic agenda + action extraction
- Token usage tracking and cost budget per workspace
```

### Phase 3: Notifications & Integrations
```
- Email notifications for action item deadlines (SendGrid)
- Slack/Teams webhook for meeting lifecycle events
- Calendar sync (Google Calendar API)
- Overdue action item daily digest
```

### Phase 4: Analytics & Reporting
```
- Meeting effectiveness trends over time
- Team accountability scores (action item completion rates)
- Average meeting duration vs. scheduled duration
- Review rating distribution and follow-up compliance
```

### Architecture Extensibility Points:
1. **Service layer** — new features add new service files, existing services untouched
2. **State machine** — adding states (e.g., "Cancelled") is a one-line dict entry
3. **AI service** — swapping LLM provider is a single file change (same interface)
4. **Models** — SQLAlchemy migrations handle schema evolution
5. **Routes** — Flask Blueprints allow modular route registration

---

## 12. Summary & Key Takeaways

| Principle | Implementation |
|-----------|---------------|
| **Backend as source of truth** | All validation server-side, frontend is display-only |
| **State machine for lifecycle** | Whitelist-based, deterministic, testable |
| **Computed not stored** | `is_overdue` as a property, never stale |
| **AI as advisor** | Cannot act, only suggest. Suggestions validated like user input |
| **Layered architecture** | Routes → Services → Models, strict boundaries |
| **Dev-prod parity** | Same code, different config (env vars only) |

---

## Quick Reference — API Endpoints

| Method | Endpoint | Access Rule |
|--------|----------|-------------|
| `POST` | `/api/meetings` | Always |
| `GET` | `/api/meetings` | Always |
| `GET` | `/api/meetings/:id` | Always |
| `PATCH` | `/api/meetings/:id/start` | Only if Scheduled |
| `PATCH` | `/api/meetings/:id/close` | Only if InProgress + has actions |
| `POST` | `/api/meetings/:id/agenda` | Only if Scheduled + within time budget |
| `PATCH` | `/api/agenda/:id` | Only if Scheduled + within time budget |
| `DELETE` | `/api/agenda/:id` | Only if Scheduled |
| `POST` | `/api/meetings/:id/actions` | Scheduled or InProgress |
| `PATCH` | `/api/actions/:id/complete` | If Open |
| `POST` | `/api/meetings/:id/review` | Only if Closed, one per meeting |
| `GET` | `/api/dashboard` | Always |
| `POST` | `/api/ai/suggest-agenda` | Always (advisory) |
| `POST` | `/api/ai/suggest-actions` | Always (advisory) |
| `POST` | `/api/ai/summarize-review` | Always (advisory) |
