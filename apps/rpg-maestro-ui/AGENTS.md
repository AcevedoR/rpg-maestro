# Agent Guide (rpg-maestro-ui)

This guide applies to the React + Vite UI in `apps/rpg-maestro-ui`.
Follow the repo root guide for shared rules: `AGENTS.md`.

## Key stack

- React + Vite
- React Router + Auth0
- styled-components + MUI theme

## Commands (from repo root)

- Lint: `npx nx lint rpg-maestro-ui`
- Unit tests: `npx nx test rpg-maestro-ui`
- Build: `npx nx build rpg-maestro-ui`
- Dev server: `npx nx run rpg-maestro-ui:serve`
- E2E: `npx nx e2e rpg-maestro-ui-e2e`

## UI conventions

- Keep `.css` imports near the top of the module.
- Match existing styled-components patterns (see `apps/rpg-maestro-ui/src/app/app.tsx`).
- Prefer workspace path aliases for shared libs when applicable.
