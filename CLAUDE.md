# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

RPG Maestro is an Nx monorepo for broadcasting music during tabletop RPG sessions. It consists of two NestJS backends, a React + Vite frontend, and Playwright E2E tests.

- `apps/rpg-maestro` — NestJS backend API (tracks, sessions, auth, admin)
- `apps/audio-file-uploader` — NestJS service for audio uploads + YouTube ingestion
- `apps/rpg-maestro-ui` — React + Vite frontend (soundboard for maestro, player UI for audience)
- `apps/rpg-maestro-ui-e2e` — Playwright E2E tests
- `libs/*-api-contract` — Shared DTOs/contracts between frontend and backend
- `libs/test-utils` — Shared test utilities

## Commands

Run from repo root unless noted.

```bash
# Install
npm ci

# Dev servers
npx nx run rpg-maestro:dev        # Backend API (port 3000)
npx nx run audio-file-uploader:dev
npx nx run rpg-maestro-ui:serve   # Frontend (port 4200)

# Lint / build / test (affected)
npx nx affected -t lint
npx nx affected -t build
npx nx affected -t test

# Single project
npx nx lint <project>
npx nx build <project>
npx nx test <project>

# Run a single unit test
npx nx test <project> --testFile=apps/.../my-file.spec.ts
npx nx test <project> -- --testNamePattern "My test name"

# E2E (Playwright)
npx nx e2e rpg-maestro-ui-e2e
npx nx e2e rpg-maestro-ui-e2e -- --grep "my test"
npx nx e2e rpg-maestro-ui-e2e -- apps/rpg-maestro-ui-e2e/src/my.spec.ts
```

**Nx target dependencies:** `lint` depends on `build`; `test` depends on `lint`; `e2e` depends on `test`. Plan accordingly.

## Architecture

### Backend: rpg-maestro

NestJS app with these core modules:
- `maestro-api` — track management, playback, onboarding, user management
- `track-collection` — grouping of tracks
- `sessions` — multiple concurrent sessions per user
- `auth` — cookie-based Auth0 guards
- `admin` — admin board
- `infrastructure/database` — DB abstraction (in-memory implementation)
- `health` — `GET /health`

Swagger docs at `/api`. FFmpeg is available for audio processing.

### Backend: audio-file-uploader

NestJS app handling multipart file uploads (Multer) and YouTube download/conversion (ytdl-core). Exposes a job store for tracking async uploads. Serves uploaded files as static assets.

### Frontend: rpg-maestro-ui

React Router routes:
- `/maestro/:sessionId` — Maestro soundboard (control panel)
- `/maestro/manage/:sessionId` — Track management
- `/maestro/track-collections` — Collection management
- `/maestro/admin` — Admin dashboard
- `/:sessionId` — Player UI (public, no auth)
- `/onboarding` — User setup flow
- `/health` — Health status

Auth: Auth0 in production, fake token in dev. Styling: styled-components + MUI dark theme.

### Shared libs

Import via path aliases from `tsconfig.base.json`:
- `@rpg-maestro/rpg-maestro-api-contract`
- `@rpg-maestro/audio-file-uploader-api-contract`
- `@rpg-maestro/test-utils`

Nx module boundary enforcement is active — do not import across boundaries without updating `project.json` tags.

## Code conventions

- **Formatting:** Prettier, single quotes, `printWidth: 120`
- **TypeScript:** Always type async function returns; avoid `any`; use `unknown` + narrowing; prefix unused vars with `_`
- **Logging:** `console.log` is disallowed; use `console.info/warn/error` or NestJS `Logger`
- **Backend errors:** Use NestJS `HttpException`, `ForbiddenException`, etc. with `HttpStatus`
- **Guards:** Use `@UseGuards` + `@Roles` — do not bypass
- **Imports:** External → workspace libs (path aliases) → relative
- **NestJS:** DI via constructor + `@Inject`; decorators from `@nestjs/common` + `@nestjs/swagger`
- **React:** styled-components + MUI themes; Auth0 bootstrapping in `app.tsx` — avoid touching unless required
