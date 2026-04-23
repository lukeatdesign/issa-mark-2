# Migration Prompt — Wayfarer Mark 2

Paste this **entire file** as your first message in a new Claude Code conversation. Make sure the new conversation's working directory is set to `C:\issa-compass-mark-2` (open it via File → Open Folder in the Claude Code desktop app, or `cd C:\issa-compass-mark-2` before launching).

---

## IMPORTANT — read this first

This is a **continuation** of an existing project. The repo already exists at `C:\issa-compass-mark-2`. Do NOT scaffold, create, or suggest creating anything from scratch. Do NOT ask whether to copy from another repo. Before doing anything else, run `ls C:\issa-compass-mark-2` (or use the Glob tool on that path) to confirm the repo is there, then ask me what I'd like to work on next.

---

## Project context

**Wayfarer Mark 2** — Thailand work immigration assistant. Full-stack demo app (no email verification, demo accounts only).

- **Repo:** `C:\issa-compass-mark-2`
- **Stack:** Next.js 14 App Router · Flask · Supabase · Claude AI (claude-sonnet-4-6)
- **Frontend:** `frontend/` — Tailwind, Zustand (persist middleware), Heroicons v2
- **Backend:** `backend/` — Flask, `app.py` (routes), `chat.py` (Claude calls)
- **Auth:** JWT stored in Zustand `useAuthStore` (`wayfarer_auth` localStorage key), no Supabase magic link — plain username/password via `/login` and `/register`

---

## What's been built (all complete)

### Pages
| Route | Purpose |
|---|---|
| `/` | Landing page — Sign in (primary) + Sign up (outlined) nav buttons |
| `/login?tab=signup` | Unified auth page — two tabs: Sign In / Sign Up with toast on success |
| `/onboarding` | 7-step quiz (see below) → redirects to `/dashboard/chat` |
| `/dashboard` | Overview: greeting, AI summary card, next actions, documents + status grid |
| `/dashboard/chat` | Main chat UI — auto-welcome fires on first visit after quiz |
| `/dashboard/roadmap` | Expandable task stepper |
| `/dashboard/documents` | Document checklist |
| `/dashboard/status` | Application status timeline |

### Onboarding quiz (7 steps, `frontend/src/app/onboarding/page.tsx`)
1. **Name** — text input, skippable ("I'll share my name later in the chat")
2. **Intent** — option cards (work company / work remote / own business / exploring / skip)
3. **Work type** — option cards (manual / professional / creative / skip)
4. **Nationality** — typeahead text input (not a dropdown), filters NATIONALITIES list, keyboard navigable
5. **Job offer** — option cards
6. **Current visa** — option cards
7. **Urgency** — option cards

Animation: `SlideQuestion` with `useLayoutEffect` + double-RAF for directional slide. `animLock` ref (sync guard) + `isAnimating` state (drives `disabled` props reactively). `triggerForward`/`triggerBack` set both.

Stepper: absolute-track pattern, `justify-between` circles, labels below. `totalSteps` is NOT persisted (uses `partialize` in `useOnboardingStore`) so it always reads 7 from initial state.

After last step: logged-in users → `/dashboard/chat`; guests → `RegisterModal`.

### Key stores (`frontend/src/store/`)
- `auth.ts` — `useAuthStore` — `isLoggedIn`, `token`, `username`, `lastUsername`, `clearAuth()`, persisted as `wayfarer_auth`
- `onboarding.ts` — `useOnboardingStore` — `currentStep`, `answers`, `totalSteps` (not persisted), persisted as `wayfarer_onboarding`
- `chat.ts` — `useChatStore` — multi-thread message store (`threads: Record<threadId, ChatMessage[]>`), `GENERAL_THREAD_ID`, persisted as `wayfarer_chat`
- `chatTaskPanel.ts` — `useChatTaskPanelStore` — `helpMode`, `activeTask`, `panelExpanded`

### localStorage keys in use
`wayfarer_auth`, `wayfarer_onboarding`, `wayfarer_chat`, `wayfarer_roadmap`, `wayfarer_overview_cache`, `wayfarer_docs_count`, `wayfarer_active_task`, `wayfarer_documents_checklist`

On user switch (detected via `lastUsername`): all app keys are cleared + stores reset.

### Chat page (`frontend/src/app/dashboard/chat/page.tsx`)
- Auto-welcome: fires once (`welcomeFired` ref) when onboarding + chat stores are hydrated and `generalMessages` is empty. Generates welcome locally (no backend call) using `nationality`, `intent`, and `derivePath()` from quiz answers.
- Multi-thread: general thread (`GENERAL_THREAD_ID`) + per-task threads keyed by task name/id
- Side panel: `TaskPanel` (collapsible) showing roadmap tasks + subtask checkboxes
- `RoadmapContextPanel`: readiness signals, generate/regenerate roadmap button

### TaskPanel (`frontend/src/components/chat/TaskPanel.tsx`)
- `done` state lazy-initialised from `wayfarer_roadmap` localStorage (survives navigation)
- `markTaskDoneByName` iterates both `userTasks` and `employerTasks`
- "Yes, done" button calls `writeSubtaskChecked()` before state update
- "Go to Overview" → `/dashboard`

### Documents (`frontend/src/app/dashboard/documents/page.tsx` + overview)
- Source of truth: `wayfarer_documents_checklist` localStorage key — `{ ready: Record<string, boolean> }`
- Overview `DocumentsCard` reads from same key, teal color scheme

### Application Status (`frontend/src/app/dashboard/status/page.tsx`)
- `flex gap-4` layout per stage row; connector line is `flex-1 min-h-8 my-1` (fills content height, no fixed px)

---

## Recent session changes (this conversation)

1. **Sign out button** added below "Back to previous question" in onboarding footer (steps > 0). Same `handleExitOnboarding` handler. Shows "Sign out" if logged in, "Cancel" if guest.

2. **Back button bug fixed** — `animLock` (ref) can't reactively drive `disabled` props because refs don't trigger re-renders. Added `isAnimating` state alongside the ref: ref is the sync guard inside trigger functions; state drives all `disabled` props so buttons re-enable after animation.

3. **Nationality step** changed from `<select>` dropdown to `NationalityTypeahead` component:
   - Text input, auto-focuses, filters NATIONALITIES on type (up to 8 matches)
   - Keyboard: ↑↓ navigate, Enter select, Esc close
   - `onBlur` with 150ms delay so `onMouseDown` on suggestion fires first
   - `Continue →` disabled until a code is confirmed via selection
   - NATIONALITIES list expanded from 27 → 57 countries

4. **Stepper count fix** — `totalSteps` excluded from Zustand persist via `partialize` so stale `6` from localStorage no longer overrides the correct `7`.

---

## Deferred / not yet built
- i18n (spec calls for EN/TH/MY/LO — `next-intl` not installed)
- pgvector embedding integration in `backend/knowledge.py` (stub, returns empty list)
- 5 immigration path seeds: `smart_visa`, `non_b_self_employed`, `digital_nomad_grey`, `border_run_strategy`, `non_o_dependent`
- Mobile optimization pass
- Voice input / document scanning (required for Nozim persona — Mon migrant worker, 55+, oral Thai only)
