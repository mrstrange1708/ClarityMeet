# ClarityMeet

# **Meeting Outcome Tracker**

## **High-Level Design (HLD)**
## **1. Overview**

Meeting Outcome Tracker is a structured meeting accountability system designed to enforce discipline in remote team collaboration.

The system ensures that meetings are:

- Agenda-driven
- Outcome-focused
- Action-oriented
- Measurable
- Reviewable

The core philosophy is **preventing invalid states rather than relying on user behavior**.

This is not a note-taking tool.

This is a governance tool for decision and action accountability.

---

## **2. Objectives**

The system aims to:

1. Enforce structured meeting preparation.
2. Ensure meetings produce measurable outcomes.
3. Prevent closure of meetings without actionable items.
4. Track ownership and deadlines clearly.
5. Surface overdue and unresolved commitments.
6. Maintain clear state transitions.
7. Provide observability into meeting effectiveness.

---

## **3. Core Features**

### **3.1 Meeting Lifecycle Management**

Each meeting follows a strict lifecycle:

- Scheduled
- InProgress
- Closed
- Reviewed

Rules:

- Cannot skip lifecycle stages.
- Cannot close a meeting without action items.
- Cannot review a meeting unless it is closed.
- Cannot modify agenda after meeting is closed.

---

### **3.2 Agenda Management**

Each meeting must contain agenda items.

Features:

- Add structured agenda topics.
- Time allocation per topic.
- Optional enforcement of total time limit.

Rules:

- Time allocation must be positive.
- Cannot add agenda once meeting starts.
- Agenda cannot be modified after closure.

Purpose:

Enforces preparation discipline before execution.

---

### **3.3 Action Item Enforcement**

Each meeting must produce actionable outcomes.

Each Action Item must include:

- Description
- Owner
- Deadline
- Status (Open / Completed / Overdue)

Rules:

- Cannot create action item without owner.
- Cannot create action item without deadline.
- Deadline must be a future date.
- Overdue automatically detected.
- Cannot close meeting if any action item is incomplete.

Purpose:

Prevents meetings from ending without accountability.

---

### **3.4 Overdue Detection & Accountability**

The system automatically:

- Flags overdue action items.
- Surfaces them on dashboard.
- Logs state transitions.

This ensures observability and failure visibility.

---

### **3.5 Meeting Review**

After a meeting is closed:

- A structured review must be recorded.
- Outcome rating (1–5 scale).
- Summary.
- Follow-up requirement flag.

Rules:

- Review only allowed after closure.
- If rating < 3 → follow-up must be required.

Purpose:

Encourages reflection and continuous improvement.

---

### **3.6 Dashboard**

The dashboard provides:

- Upcoming meetings
- Open action items
- Overdue action items
- Meetings pending review

Goal:

Surface risk and accountability gaps immediately.

---

### **3.7 AI-Assisted Features (Controlled)**

AI may assist with:

- Generating agenda drafts
- Suggesting action items
- Summarizing review notes

Constraints:

- AI cannot modify meeting state.
- AI cannot bypass validations.
- AI outputs must pass server-side validation.

Purpose:

Demonstrates responsible AI integration.

---

## **4. Non-Functional Requirements**

### **4.1 Structure**

- Clear separation of concerns.
- Business logic isolated from routing.
- Centralized validation logic.
- State transitions handled in one module.

---

### **4.2 Simplicity**

- Avoid unnecessary abstractions.
- Keep domain model minimal.
- Prefer explicit over clever logic.

---

### **4.3 Correctness**

System prevents:

- Closing meetings without outcomes.
- Action items without ownership.
- Invalid lifecycle transitions.
- Missing deadlines.
- Silent failures.

---

### **4.4 Change Resilience**

Design ensures:

- Adding new meeting states does not break transitions.
- Adding new fields does not impact validation logic globally.
- Future role-based access can be integrated without major refactor.

---

### **4.5 Observability**

- Log state transitions.
- Log invalid transition attempts.
- Log overdue detections.

Failures must be diagnosable.

---

### **4.6 Verification**

The system will include automated tests covering:

- Lifecycle enforcement
- Action item validation
- Overdue detection
- Invalid state prevention

---

## **5. System Architecture**

### **Backend**

- Python
- Flask REST API
- Service layer for business rules
- Validation layer for schema enforcement
- Relational database

### **Frontend**

- React
- Simple state management
- REST-based integration

### **Database**

Relational schema with:

- Meetings
- AgendaItems
- ActionItems
- Reviews

Relationships enforced via foreign keys.

---

## **6. Design Principles**

1. Prevent invalid states.
2. Centralize rule enforcement.
3. Keep business logic out of controllers.
4. Prefer explicit state machines.
5. Validate at boundaries.
6. Make failures visible.
7. AI assists — never controls.

---

## **7. Risks**

1. Over-engineering lifecycle logic.
2. Mixing validation with route handlers.
3. Letting frontend enforce rules instead of backend.
4. AI-generated code introducing unsafe logic.
5. Skipping automated verification.

Mitigation:

- Centralize state transitions.
- Strict schema validation.
- Add minimal but meaningful tests.
- Review all AI-generated code manually.

---

## **8. Future Extensions**

- Role-based access control
- Slack integration
- Calendar sync
- Recurring meeting templates
- Analytics on meeting effectiveness
- AI-driven performance insights

---

## **9. Key Engineering Statement**

This system is designed to enforce meeting accountability by preventing invalid state transitions and ensuring every meeting results in structured, owned, and measurable outcomes.