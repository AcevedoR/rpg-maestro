# RPG Maestro — Developer Quick Reference

> Auto-maintained by Claude. Keep in sync with CLAUDE.md and architecture.md.

## Local Dev Setup

```bash
npm ci

# Terminal 1 — Backend API
npx nx run rpg-maestro:dev         # http://localhost:3000
                                   # Swagger: http://localhost:3000/api

# Terminal 2 — Audio uploader
npx nx run audio-file-uploader:dev  # http://localhost:3001

# Terminal 3 — Frontend
npx nx run rpg-maestro-ui:serve    # http://localhost:4200
```

Enable dev mode (fake IDP, no Auth0):
```
localStorage.setItem('isDevMode', 'true')
# then go to http://localhost:4200/dev/fake-idp-login-page
```

## Commands

```bash
# Lint / Build / Test — affected projects only
npx nx affected -t lint
npx nx affected -t build
npx nx affected -t test

# Single project
npx nx lint rpg-maestro
npx nx build rpg-maestro
npx nx test rpg-maestro

# Run one spec file
npx nx test rpg-maestro --testFile=apps/rpg-maestro/src/app/maestro-api/TrackService.spec.ts

# Run tests matching a name pattern
npx nx test rpg-maestro -- --testNamePattern "should return the created track"

# E2E — requires all three services running on e2e ports
npx nx e2e rpg-maestro-ui-e2e
npx nx e2e rpg-maestro-ui-e2e -- --grep "play a track"
npx nx e2e rpg-maestro-ui-e2e -- apps/rpg-maestro-ui-e2e/src/e2e.spec.ts

# Docker build & push
npx nx docker-build rpg-maestro
npx nx deploy rpg-maestro
```

## Environment Files

| File | Used by |
|------|---------|
| `apps/rpg-maestro/.env.development` | `nx run rpg-maestro:dev` |
| `apps/rpg-maestro/.env.e2e-tests` | E2E test runner |
| `apps/audio-file-uploader/.env.e2e-tests` | E2E test runner |
| `apps/rpg-maestro-ui/.env` | Vite dev server (create from `.env.example` if present) |

## Adding a New Feature — Checklist

1. **Backend module** — create under `apps/rpg-maestro/src/app/<module>/`
   - `<module>.module.ts` with providers + controllers
   - Import in `app.module.ts`
2. **API contract** — add DTOs in `libs/rpg-maestro-api-contract/src/lib/`
   - Re-export from `index.ts`
3. **DB entity** — implement interface in `infrastructure/persistence/in-memory/` AND `firestore/`
   - Register in `DatabaseModule` and `DatabaseWrapperConfiguration`
4. **Auth** — annotate controllers with `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles([...])`
5. **Frontend** — add API calls in `apps/rpg-maestro-ui/src/app/maestro-ui/maestro-api.ts`
6. **Tests** — unit tests alongside source; E2E in `apps/rpg-maestro-ui-e2e/src/`
7. **Update docs** — `docs/architecture.md` if the module changes system topology

## Adding a New Route (Frontend)

1. Create component in appropriate feature folder (`maestro-ui/`, `players-ui/`, etc.)
2. Register route in `apps/rpg-maestro-ui/src/app/app.tsx`
3. If auth-protected, wrap with `<PrivateRoute>` or `withAuthenticationRequired`
4. Add to route table in `docs/architecture.md`

## Nx Module Boundary Rules

Tags in `project.json` enforce import boundaries via ESLint:

| Tag | Meaning |
|-----|---------|
| `type:app` | Application |
| `type:lib` | Shared library |
| `type:e2e` | E2E test project |
| `scope:backend` | Backend-only |
| `scope:frontend` | Frontend-only |
| `scope:shared` | Can be imported by both |

Do not import a `scope:backend` library from a `scope:frontend` project.

## Testing Patterns

### Unit Tests (Vitest)

```typescript
// Backend — use real services with in-memory DB
const databases = new DatabaseWrapperConfiguration('in-memory');
const service = new TrackService(databases, ...);
const result = await service.createTrack(sessionId, trackCreation);
expect(result.name).toEqual('expected-name');
```

```typescript
// Frontend — @testing-library/react
render(<MyComponent />);
await userEvent.click(screen.getByRole('button', { name: 'Play' }));
expect(screen.getByText('Playing...')).toBeInTheDocument();
```

### E2E Tests (Playwright)

```typescript
// Setup: init fixtures via API
const users = await initUsersFixtureSpec();
const session = await generateNewSession(users.a_maestro_user);
await iniTracksFromFileServerFixture(session, session.sessionId);

// Auth: inject token into browser storage
await simulateAuthenticatedInBrowser(page, session);

// Navigate and assert
await page.goto(`/maestro/${session.sessionId}`);
await expect(page.locator('.MuiDataGrid-row')).toHaveCount(3);
```

## Common Pitfalls

- **CORS errors**: `DEFAULT_FRONTEND_DOMAIN` must match the frontend origin exactly (no trailing slash)
- **Auth failures in dev**: Check `isDevMode` in localStorage; backend must have fake IDP route active
- **Firestore cold start**: `DATABASE=firestore` requires Firebase service account credentials (`GOOGLE_APPLICATION_CREDENTIALS` or env var)
- **FFmpeg not found**: Install FFmpeg locally (`brew install ffmpeg`) or set `FFMPEG_PATH` / `FFPROBE_PATH`
- **Nx cache stale**: Run `npx nx reset` to clear the Nx task cache
- **E2E port conflicts**: E2E uses ports 8098/8099/4300; ensure nothing else binds those
- **YouTube extraction**: `ytdl-core` occasionally breaks when YouTube changes their API — check for `@distube/ytdl-core` updates

## Useful HTTP Examples

See `apps/rpg-maestro/examples/SetupDevEnvironment.http` for ready-to-run API calls
(compatible with the VS Code REST Client or IntelliJ HTTP client).
