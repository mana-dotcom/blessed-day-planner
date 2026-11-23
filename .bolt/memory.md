# Project memory

## Product intent & audience

- **Blessed Day Planner**: a personal daily planning app for Muslims combining spiritual and self-care routines.
- Tracks Salat (prayers), Athkar (remembrance), morning/evening skincare routines, hydration/water intake, and tasks/time blocks.
- Bilingual support: English and French.
- The former "Agent" (Gemini AI assistant) tab was removed entirely; there is no AI feature in the app.

## Brand personality & voice

- Gentle, encouraging, faith-oriented tone.
- "Blessed" branding — Islamic daily life context (Salat, Athkar).
- Bilingual EN/FR throughout, with language toggles.

## Visual design & UX direction

- **Theme**: pink/burgundy glassmorphism — frosted glass cards, translucent surfaces, pink and burgundy accent colors.
- **Layout**: bottom navigation bar with icon-based tabs (Home, Today, Glow, Health, Study, Bilan); each route is a full-page view.
- **Components**: glassmorphic cards, rounded corners, soft shadows, consistent with existing routes.
- **Responsive**: mobile-first planner layout.

## Decisions, constraints & rationale

- **Framework**: Vite + React + TanStack Router (file-based routing with auto-generated `routeTree.gen.ts`).
- The dev server regenerates `routeTree.gen.ts` when route files are added or removed.

## Open questions & assumptions

- Existing localStorage schema for progress data is assumed stable.
