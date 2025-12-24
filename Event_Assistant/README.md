# Event Assistant – Full Project Specification (Cursor Build)

Event Assistant is an AI copilot for conferences and trade shows that helps attendees, exhibitors, and organizers get more value from events through conversational workflows.

## Core workflows (v1)

- **Agenda copilot**: "What's next for me?", "Find sessions about X", "Add this to my schedule."
- **Networking copilot**: "Who should I meet about X?", "Draft a message to this attendee."
- **Exhibitor assistant**: "Which booths match my interests?", "Summarize vendor offerings."
- **Updates & wayfinding**: "Any changes to Session 12?", "Where is Room B?", "What's happening now?"
- **Contact capture (v1.1)**: "Scan/import business card → enriched contact + follow‑up email draft."

## Stack assumptions

- **Frontend**: Next.js/React + TypeScript, Tailwind/Chakra (or similar) with dark, bento/glass design.
- **Backend**: Node/TypeScript (Next API routes or Express/Fastify), Prisma + Postgres.
- **AI**: Hosted LLM (for reasoning + generation), vector DB for RAG (Qdrant/PGVector/etc.), observability via logs/metrics.
- **Dev environment**: Cursor AI with `.cursorrules` enforcing feature‑based folders, strict TS, tests, security.

---

## 1. Product definition

### 1.1 Primary user jobs (v1)

**Attendee:**

- **Ask & act on the agenda**:
  - "What's next for me right now?"
  - "Show sessions about {topic} this afternoon."
  - "Add this session to my schedule and avoid overlaps."

- **Networking copilot**:
  - "Who should I meet about {topic/role}?"
  - "Draft an intro message to this person."

- **Exhibitor assistant**:
  - "Which booths match my interests?"
  - "Summarize what this vendor offers in 2 sentences."

- **Updates & wayfinding Q&A**:
  - "Is Session 12 delayed or moved?"
  - "Where is the registration desk / Room B / Expo Hall?"

- **Contact capture (v1.1)**:
  - "Scan/import this business card."
  - "Enrich with public data (company, LinkedIn, website)."
  - "Draft a follow‑up email with context from our meeting."

**Organizer:**

- **Reduce support load**: event bot answers common FAQs and logistics questions.
- **Increase engagement**: more sessions attended, more meetings booked, more exhibitor leads.
- **Analytics**: see where attendees get stuck (questions, failed searches, missed connections).

### 1.2 Definition of Done (Event Assistant v1)

- ≥80% task success on scripted eval set for top workflows (agenda, networking, updates).
- Hallucination rate below agreed threshold on grounded Q&A (agenda/attendees/exhibitors); answers must be backed by retrieved docs.
- PII‑safe logging and access controls implemented; security/privacy checklist signed off.
- Red‑teaming pass on: prompt injection, malicious exhibitor content, abusive messaging scenarios.
- Observability dashboard: latency, retrieval quality, tool success, and user satisfaction metrics visible.

---

## 2. Data & integrations

### 2.1 Data sources

**Event agenda**
- **Sessions**: id, title, abstract, tags, speakers, start/end time, track, room, capacity.
- **Speakers**: id, name, title, org, bio, links.

**Attendees & exhibitors (permissions‑based)**
- **Attendee profiles**: id, name, role, company, interests, visibility flags.
- **Exhibitors**: id, name, description, categories, products, booth location, sponsorship tier.

**Announcements/notifications**
- Feed of schedule changes, room changes, important updates, push notifications.

**Venue maps / FAQs / help center**
- Floorplans, rooms, exhibitor hall layout.
- **FAQs**: registration, Wi‑Fi, app usage, accessibility, code of conduct.

**Messaging system**
- Internal messages: sender, recipient, content, timestamps, status.
- Meeting requests: invitee, proposed time slots, location or virtual link.

### 2.2 Data contracts

Define canonical schemas:
- `session` (session_id)
- `person` (person_id)
- `exhibitor` (exhibitor_id)
- `announcement` (announcement_id)
- `location` (location_id)

**Contracts**:
- All references in agent logs and tools use canonical IDs.
- Freshness guarantees: schedule/announcement updates reflected in index within 60 seconds (via webhooks or polling).
- Versioning: if session/exhibitor details change, keep version history for audit.

---

## 3. Agent architecture

**Pattern**: Grounded RAG + tools, with explicit policy/checks.

**Components**:

- **LLM layer**: Handles conversation, reasoning, tool orchestration.
- **Retrieval layer**: Vector + keyword search over agenda, exhibitors, FAQs, announcements, maps.
- **Tools layer**: Tools for search, filter, add‑to‑agenda, message draft, meeting request, contact enrichment, etc.
- **Policy & safety**:
  - Permissions/visibility checks.
  - PII redaction and safe responses.
  - "No‑claim" constraints on attendee data (never invent roles or interests).
- **Observability**: Traces, tool‑call logs, evaluation hooks, offline replay.

### 3.1 Intent router

**Intent types**:
- `FACT_QA` – "What time is Session X?", "Where is Room B?"
- `ACTION` – "Add this to my schedule", "Send this message", "Create a meeting."
- `RECOMMENDATION` – "Who should I meet about X?", "What sessions match my interests?"
- `META / SMALL_TALK` – generic chit‑chat or meta questions.

**Router implementation**:
- Lightweight classifier (prompted LLM) or simple rules + examples.
- Output: intent type, entities (sessions, people, exhibitors), required tools.

### 3.2 Ranker

**Candidate ranking for sessions/people/exhibitors**:
- Use hybrid retrieval (BM25 + embeddings) to generate candidates.
- Re‑rank with a small scoring model or LLM scoring based on relevance, time/room constraints, and user preferences.

**Explainability**:
- For each suggested item, store rationale text ("Matches your interest in AI, fits your free slot at 3–4pm").

### 3.3 Memory

**Per‑user memory**:
- "My agenda": sessions added, removed, and conflicts resolved.
- **Preferences**: topics clicked, sessions bookmarked, tracks attended, networking interests.

**Controls**: toggle "Use my behavior to personalize suggestions", clear/reset history, export/delete data.

---

## 4. Modeling plan (Weeks 3–6)

### 4.1 Baselines

**Baseline A: Simple RAG Q&A**
- Single retriever; answers must quote or reference top‑k passages.
- **Metrics**: retrieval hit rate, faithfulness, answer relevance (LLM‑as‑judge).

**Baseline B: Zero‑shot tool agent**
- Agent calls tools without custom domain skills.
- **Metrics**: tool success, action correctness, latency per workflow.

### 4.2 Improvements

**Domain skills**
- **Agenda planner**: conflict‑aware scheduling and suggestions.
- **Networking recommender**: match people by interests, roles, and behavior.
- **Announcement summarizer**: compress updates into digestible summaries grounded to official announcements.

**Lightweight personalization**
- Session‑level embeddings for real‑time personalization based on browsing and clicks.
- User preference store keyed by user_id with opt‑in, reset, and anonymized modes.

**Message drafting**
- **Tone presets**: Friendly, Professional, Brief, Enthusiastic, Follow‑up.
- **Guardrails**: toxicity filters, anti‑spam rules (no mass outreach), restrictions on sensitive inferences.

---

## 5. Evaluation & safety

### 5.1 Offline evaluation suites

- **Retrieval accuracy**: For each query, ensure correct session/person/exhibitor is in top‑k.
- **Grounded answer faithfulness**: LLM‑as‑judge to assert: "Is this answer fully supported by citations?"
- **Action correctness**:
  - Did "add to schedule" add the correct session without conflicts?
  - Did "draft message" follow the selected tone and avoid restricted content?
- **Latency & cost**: p50/p95 latency per workflow; estimated cost per conversation.

### 5.2 Safety

- **PII and permissions**: Enforce visibility rules (e.g., only show attendee profiles if they opted in).
- **Pseudonymize logs**, store minimal necessary IDs.
- **Prompt injection**: Test with adversarial exhibitor descriptions, agenda texts, and messages attempting to override policies.
- **"No‑claim" rules**: Never invent attendee attributes; ask for clarification instead.
- Use **strong refusal language** for disallowed actions (e.g., harassment, doxxing).

---

## 6. MVP build plan (8‑week solo Cursor sprint)

**Week 1 – Requirements & data**
- Finalize PRD (this file) and success metrics.
- Map event's real data sources: agenda, attendees, exhibitors, announcements, FAQs.
- Commit `DATA_CONTRACTS.md` and simple seed dataset to the repo.

**Week 2 – Data pipelines & indexing**
- Implement ETL to Postgres and vector DB.
- Index agenda, exhibitors, FAQs, announcements into vector DB.
- Add health checks and data freshness monitoring.

**Week 3 – Agent v0 + basic UI**
- Implement Baseline RAG + tools in `packages/agent`.
- Build chat surface in `/features/chat` and simple "What's next?" agenda view.

**Week 4 – Agenda assistant end‑to‑end**
- Implement agenda planner skill and conflict detection.
- Add "Add to my schedule" tools and UI; show conflicts and alternatives.

**Week 5 – Networking copilot**
- Implement networking recommender, attendee search, and suggested intros.
- Add message drafting with tone presets and guardrails.

**Week 6 – Exhibitor assistant + announcements**
- Implement exhibitor discovery, booth suggestions, and vendor summaries.
- Add announcements summarizer and "What changed?" queries.

**Week 7 – Eval, safety, and monitoring**
- Build `EVAL_DASHBOARD` view showing retrieval accuracy, grounding, tool success, latency.
- Run red‑team scenarios; tighten policies and refusals.

**Week 8 – Pilot launch**
- Deploy pilot event environment.
- Collect feedback, bug bash, and create v1.1 backlog (contact capture, richer personalization).

---

## 7. Implementation blueprint for Cursor

### 7.1 Repo structure

Use a monorepo pattern that Cursor understands:
- `apps/web` – Next.js/React front‑end (chat, agenda, networking, exhibitors, updates).
- `apps/api` – API routes and webhooks (TypeScript).
- `packages/agent` – Agent logic, RAG, tools, policy.
- `packages/db` – Prisma schema, migrations, data access.
- `packages/ui` – Shared components (Bento tiles, chat, cards).
- `docs` – `PRD.md` (this), `ARCHITECTURE.md`, `DATA_CONTRACTS.md`, `EVAL_PLAN.md`, `SECURITY_PRIVACY.md`.

### 7.2 Frontend feature folders

In `apps/web/src/features`:

- **`agenda/`**
  - pages: main agenda, "My agenda", session details.
  - components: `AgendaList`, `SessionCard`, `ConflictBanner`.

- **`networking/`**
  - pages: `SuggestedConnections`, `PeopleSearch`.
  - components: `ProfileCard`, `ConnectionReason`, `MessageComposer`.

- **`exhibitors/`**
  - pages: `ExhibitorList`, `ExhibitorDetail`, `RecommendedBooths`.

- **`updates/`**
  - pages: `AnnouncementsFeed`, `WhatChanged`.
  - components: `AnnouncementCard`, `ChangeSummary`.

- **`contacts/` (v1.1)**
  - pages: `ContactInbox`, `BusinessCardScan`.
  - components: `ContactCard`, `FollowUpDraft`.

### 7.3 Backend modules

In `apps/api/src`:

- `routes/agenda.ts` – sessions CRUD, agenda queries.
- `routes/networking.ts` – attendee search, recommendations, messages.
- `routes/exhibitors.ts` – exhibitor search and suggestions.
- `routes/updates.ts` – announcements, schedule changes.
- `routes/contacts.ts` – business card ingestion, enrichment.
- `routes/agent.ts` – chat endpoint orchestrating the agent.

In `packages/db/src/schema.prisma`:
- Models for `Event`, `Session`, `Speaker`, `Person`, `Exhibitor`, `Announcement`, `Location`, `UserAgendaItem`, `Message`, `Meeting`, `Contact`, `ContactSource`.

### 7.4 Agent package

In `packages/agent`:
- `intentRouter.ts` – classify query into FACT_QA / ACTION / RECOMMENDATION / META.
- `retriever.ts` – hybrid retrieval over vector DB + keyword search.
- `ranker.ts` – ranking for sessions, people, exhibitors.
- `tools.ts` – Type‑safe tool functions calling backend routes.
- `policy.ts` – permission checks, PII redaction, no‑claim enforcement.
- `agent.ts` – main loop: route intent → retrieve → call tools → generate answer with citations.

### 7.5 `.cursorrules`

- Enforce feature‑based structure (`/features/{name}`) and typed APIs.
- Require tests for agent tools and business logic.
- Forbid logging raw PII; allow only IDs and hashed values.
- Prefer pure functions and explicit types in `packages/agent`, `packages/db`.

---

## 8. Deliverables

- `PRD.md` (this spec) in `/docs/`.
- `ARCHITECTURE.md` – diagrams and flow of agent + tools + retrieval.
- `DATA_CONTRACTS.md` – schemas, IDs, freshness SLAs.
- `TOOLS.md` – full tool catalog with signatures and examples.
- `EVAL_PLAN.md` – metrics, offline eval scripts, dashboards.
- `SECURITY_PRIVACY.md` – PII handling, RBAC, logging, red‑team plan.
- Working prototype in `apps/web` + `apps/api` showing at least agenda copilot and basic Q&A.

You can paste this into a `PRD.md` in your repo and also into Cursor as context/rules. Then you ask Cursor to:
- Scaffold the monorepo per section 7.1–7.3.
- Generate initial Prisma schema and migrations.
- Implement `packages/agent` skeleton with tests.
