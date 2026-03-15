# Agent Guide (rpg-maestro)

This repo is an Nx monorepo with NestJS backends, a React + Vite UI, and Playwright E2E.
Follow this document when acting as an agentic coding assistant.

## Where rules come from

- Cursor rules: none found in `.cursor/rules/` or `.cursorrules`.
- Copilot rules: none found in `.github/copilot-instructions.md`.
- Lint/format: `eslint.config.js` and `.prettierrc` at the repo root.

## Tooling quick facts

- Package manager: npm (`npm ci` in CI).
- Node version in CI: 20.
- Tests: Vitest (unit) + Playwright (E2E) via Nx targets.
- Lint: ESLint (flat config).
- Formatting: Prettier (`singleQuote: true`, `printWidth: 120`).

## Commands (common)

Run from repo root unless noted.

### Install

- `npm ci`

### Lint

- All projects: `npx nx run-many --target=lint --all`
- Single project: `npx nx lint <project>`

### Build

- All affected: `npx nx affected -t build`
- Single project: `npx nx build <project>`

### Unit tests (Vitest via Nx)

- All affected: `npx nx affected -t test`
- Single project: `npx nx test <project>`

### Run a single unit test

Nx forwards Vitest options. Use one of:

- Single file: `npx nx test <project> --testFile=apps/.../my-file.spec.ts`
- Single test name: `npx nx test <project> -- --testNamePattern "My test name"`
- Filter by file glob: `npx nx test <project> -- --run tests/path/**/name.spec.ts`

### E2E tests (Playwright)

- Full suite: `npx nx e2e rpg-maestro-ui-e2e`
- Single test by title: `npx nx e2e rpg-maestro-ui-e2e -- --grep "my test"`
- Single file: `npx nx e2e rpg-maestro-ui-e2e -- apps/rpg-maestro-ui-e2e/src/my.spec.ts`

### Dev servers

- Backend API (rpg-maestro): `npx nx run rpg-maestro:dev`
- Audio uploader API: `npx nx run audio-file-uploader:dev`
- UI (Vite): `npx nx run rpg-maestro-ui:serve`

### E2E setup (used by Playwright config)

- `npx nx run rpg-maestro-ui:init-e2e-setup`

### CI equivalents

- PR workflow: `npx nx affected -t lint build test` then `npx nx affected -t e2e`
- Main workflow: `npx nx affected -t lint test deploy`

## Nx target defaults (important)

- `lint` depends on `build`.
- `test` depends on `lint`.
- `e2e` depends on `test`.
  Plan test runs accordingly if you want minimal work; you can pass `--skip-nx-cache` if needed.

## Code style and conventions

Follow existing patterns in the file you touch. Do not reformat unrelated code.

### Formatting

- Prettier: single quotes, `printWidth` 120.
- Keep existing wrapping/spacing in touched files unless you are already editing that block.

### Imports

- Group imports: external packages first, then workspace libs, then local relative.
- Prefer workspace path aliases from `tsconfig.base.json` when importing libs:
  - `@rpg-maestro/rpg-maestro-api-contract`
  - `@rpg-maestro/audio-file-uploader-api-contract`
  - `@rpg-maestro/test-utils`
- Within a feature folder, relative imports are standard.

### TypeScript usage

- Always type async function returns (e.g., `Promise<User>` in Nest controllers).
- Prefer explicit DTO types from the API contracts libs.
- Avoid `any`; use `unknown` and narrow when needed.
- Unused variables: prefix with `_` (ESLint allows this).

### Naming

- React components: `PascalCase` names and `camelCase` props/locals.
- Backend controllers/services: `PascalCase` class names; file names currently use `PascalCase` in several places—keep the local convention.
- CSS/Styled Components: keep existing naming and structure; avoid large reformatting.

### Error handling

- Backend (NestJS): use `HttpException`, `ForbiddenException`, and other Nest errors with `HttpStatus` for API errors.
- Prefer early checks and explicit failures (see `AuthenticatedMaestroController` for patterns).
- Logging: `console.log` is disallowed; use `Logger` or `console.info/warn/error` only where needed.

### ESLint rules to respect

- `strict` mode is enforced globally.
- `no-console`: only `console.info`, `console.warn`, `console.error` are allowed.
- Nx module boundaries are enforced (`@nx/enforce-module-boundaries`).

### React/UI specifics

- UI uses React Router and Auth0; avoid touching auth bootstrapping unless required.
- Styling uses `styled-components` and MUI themes; follow the pattern in `apps/rpg-maestro-ui/src/app/app.tsx`.
- Keep `.css` imports near the top of the component module as in existing files.

### NestJS specifics

- Controllers use decorators from `@nestjs/common` and `@nestjs/swagger`.
- Use dependency injection via constructor + `@Inject` for services/configs.
- Do not bypass guards/roles patterns; use `@UseGuards` and `@Roles` consistently.

## Project map (high level)

- `apps/rpg-maestro`: NestJS backend API.
- `apps/audio-file-uploader`: NestJS service for uploads.
- `apps/rpg-maestro-ui`: React + Vite frontend.
- `apps/rpg-maestro-ui-e2e`: Playwright E2E tests.
- `libs/*-api-contract`: shared DTOs/contracts.
- `libs/test-utils`: shared test utilities.

## What to check before finishing

- Update/verify tests that cover changes.
- Ensure ESLint passes (no console.log, unused vars prefixed with `_`).
- Keep new code within module boundaries and use path aliases where appropriate.
