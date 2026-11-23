# Project memory

## Product intent & audience

- **Blessed Day Planner**: a personal daily planning app for Muslims combining spiritual and self-care routines.
- Tracks Salat (prayers), Athkar (remembrance), morning/evening skincare routines, hydration/water intake, and tasks/time blocks.
- Bilingual support: English and French.
- Now includes a local rule-based "Agent" assistant tab (no external AI APIs).

## Brand personality & voice

- Gentle, encouraging, faith-oriented tone.
- "Blessed" branding — Islamic daily life context (Salat, Athkar).
- Bilingual EN/FR throughout, with language toggles.

## Visual design & UX direction

- **Theme**: pink/burgundy glassmorphism — frosted glass cards, translucent surfaces, pink and burgundy accent colors.
- **Layout**: bottom navigation bar with icon-based tabs; each route is a full-page view.
- **Agent tab**: Bot icon in bottom nav; hero-style priority card, summary card, quick-action buttons, chat interface with FR/EN toggle and clear button.
- **Components**: glassmorphic cards, rounded corners, soft shadows, consistent with existing routes.
- **Responsive**: mobile-first planner layout.

## Decisions, constraints & rationale

- **100% local/rule-based assistant**: no paid API keys or external AI APIs required by design.
- **localStorage keys**: agent state stored under `blessings-agent-v1` (separate from existing app data keys) to avoid breaking existing data or styling.
- **Agent reads existing progress** from the same localStorage store the app uses (Salat, Athkar, skincare routines, hydration, tasks/time blocks) plus current time of day for context-aware suggestions.
- **Top priority logic**: time-of-day based (Fajr morning, hydration midday, night routine evening) or falls back to category with most remaining items.
- **Framework**: Vite + React + TanStack Router (file-based routing with auto-generated `routeTree.gen.ts`).
- **Build limitation**: environment lacks `node_modules` and `npm install` fails on lockfile — builds can't run locally; code must follow existing patterns exactly.

## Open questions & assumptions

- Existing localStorage schema for progress data is assumed stable; agent reads but does not mutate it.
- TanStack Router file-based routing requires `routeTree.gen.ts` updates — manual edits needed when adding routes in environments where the generator can't run.
- Language preference detection (browser locale vs. explicit toggle) not confirmed — agent uses explicit FR/EN toggle.