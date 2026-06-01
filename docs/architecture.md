# RPG Maestro — Architecture Reference

> Auto-maintained by Claude. Update this file when adding or refactoring a major module,
> changing the database layer, auth flow, API surface, or deployment topology.

## System Overview

RPG Maestro is an Nx monorepo for broadcasting music during tabletop RPG sessions.
A Maestro controls track playback from a soundboard UI; Audience members see the
currently-playing track in real time via a public player page.

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Browser                                     │
│  ┌──────────────────────┐    ┌──────────────────────────────────┐   │
│  │  rpg-maestro-ui      │    │  rpg-maestro-ui (player page)    │   │
│  │  /maestro/:sessionId │    │  /:sessionId                     │   │
│  │  Auth0 → JWT         │    │  No auth required                │   │
│  └──────────┬───────────┘    └─────────────────┬────────────────┘   │
└─────────────┼───────────────────────────────────┼───────────────────┘
              │ PUT playing-tracks                 │ GET playing-tracks (poll)
              ▼                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  rpg-maestro (NestJS, port 3000)                     │
│                                                                      │
│  JwtAuthGuard ──► RolesGuard ──► Controllers ──► Services           │
│                                                          │           │
│  Modules:                                                ▼           │
│  maestro-api | sessions | users-management               DB          │
│  track-collection | auth | admin | health                │           │
│                                               ┌──────────┴────────┐  │
│                                               │  TracksDatabase   │  │
│                                               │  UsersDatabase    │  │
│                                               │  CollectionsDB    │  │
│                                               └──────────┬────────┘  │
│                                                          │           │
│                                            ┌─────────────┴─────────┐ │
│                                            │ DATABASE env var       │ │
│                                            │  in-memory (dev)       │ │
│                                            │  firestore  (prod)     │ │
│                                            └───────────────────────┘ │
└──────────────────────────────────────────┬──────────────────────────┘
                                           │ HTTP client
                                           ▼
┌──────────────────────────────────────────────────────────────────────┐
│              audio-file-uploader (NestJS, port 3001)                 │
│                                                                      │
│  POST /api/upload/audio          ← multipart file upload             │
│  POST /api/upload/audio/from-youtube  ← queue YouTube job           │
│  GET  /api/upload/audio/from-youtube  ← poll job status             │
│                                                                      │
│  ytdl-core → FFmpeg → /uploads/  (served as static /public/)        │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Apps

### rpg-maestro (NestJS Backend)

| Item | Value |
|------|-------|
| Port (dev) | 3000 |
| Port (e2e) | 8099 |
| Entry point | `src/main.ts` → `src/app-bootstrap.ts` |
| Swagger docs | `http://localhost:3000/api` |
| Dockerfile | Alpine + FFmpeg |

**Module map:**

```
AppModule
├── DatabaseModule          DB provider (in-memory | firestore)
├── MaestroApiModule        Track CRUD, YouTube uploads, playback state
│   ├── TrackService
│   ├── ManageCurrentlyPlayingTracks
│   ├── OnboardingService
│   └── TrackCreationFromYoutubeJobsWatcher
├── SessionsModule          Session state
├── UsersManagementModule   User profiles + role management
├── TrackCollectionModule   Pre-built collections
├── AuthGuardsModule        JWT + RBAC
├── AdminModule             Admin endpoints
├── HealthModule            GET /health
└── TestsUtilsModule        Dev-only fake IDP + fixtures
```

**Key controllers:**

| Controller | Base path | Auth |
|-----------|-----------|------|
| `AuthenticatedMaestroController` | `/maestro` | JWT + Roles |
| `PlayersController` | `/` | None |
| `HealthController` | `/health` | None |
| `TestsUtilsController` | `/test-utils` | None (dev only) |

**Environment variables:**

| Variable | Dev value | Purpose |
|----------|-----------|---------|
| `DATABASE` | `in-memory` | DB driver (`in-memory` \| `firestore`) |
| `PORT` | `3000` | HTTP port |
| `AUTH_ISSUER` | `http://localhost:3000/test-utils/fake-idp` | JWT issuer |
| `AUTH_JWT_AUDIENCE` | `http://localhost:3000` | JWT audience |
| `DEFAULT_FRONTEND_DOMAIN` | `http://localhost:4200` | CORS origin |
| `DEFAULT_AUDIO_FILE_UPLOADER_API_URL` | `http://localhost:3001/api` | Audio service |
| `NODE_ENV` | `dev` | Node environment |
| `FFMPEG_PATH` / `FFPROBE_PATH` | (system default) | Audio processing |

---

### audio-file-uploader (NestJS Service)

| Item | Value |
|------|-------|
| Port (dev) | 3001 |
| Port (e2e) | 8098 |
| Entry point | `src/main.ts` |
| Static assets | `/public` (served from `./uploads/`) |

**Endpoints:**

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/health` | Health check |
| `POST` | `/api/upload/audio` | Multipart file upload |
| `POST` | `/api/upload/audio/from-youtube` | Queue YouTube extraction (202) |
| `GET` | `/api/upload/audio/from-youtube` | List extraction jobs |

**YouTube pipeline:** `ytdl-core` → raw audio → `FFmpeg` → MP3 → `/uploads/` → served via `/public/`

---

### rpg-maestro-ui (React + Vite Frontend)

| Item | Value |
|------|-------|
| Port (dev) | 4200 |
| Port (preview/e2e) | 4300 |
| Entry point | `src/main.tsx` → `src/app/app.tsx` |
| Bundler | Vite 7.x |
| Style | styled-components 5 + MUI dark theme |

**Route map:**

| Route | Component | Auth |
|-------|-----------|------|
| `/` | `WelcomePage` | None |
| `/login` | `LoginPage` | None |
| `/health` | `HealthStatus` | None |
| `/onboarding` | `Onboarding` | Required |
| `/onboarding/setup-session` | `SetupSession` | Required |
| `/maestro/infos` | User profile | Required |
| `/maestro/:sessionId` | `MaestroSoundboard` | Required |
| `/maestro/manage/:sessionId` | `TracksManagement` | Required |
| `/maestro/track-collections` | `TrackCollections` | Required |
| `/maestro/admin` | `AdminBoard` | Required (ADMIN) |
| `/:sessionId` | `PlayersUi` | None |
| `/dev/fake-idp-login-page` | Dev fixture | Dev mode only |

**Environment variables (Vite `VITE_` prefix):**

| Variable | Purpose |
|----------|---------|
| `VITE_AUTH0_DOMAIN` | Auth0 tenant domain |
| `VITE_AUTH0_CLIENT_ID` | Auth0 SPA client ID |
| `VITE_RPG_MAESTRO_API_URL` | Backend API base URL |

**Feature flag:** `localStorage.getItem('isDevMode') === 'true'` → enables fake IDP

---

## Shared Libraries

### rpg-maestro-api-contract

Path alias: `@rpg-maestro/rpg-maestro-api-contract`

Core types shared between backend and frontend:

| Type | Purpose |
|------|---------|
| `Track` | Track entity (id, sessionId, url, name, duration, tags, source) |
| `PlayingTrack` | Track with playback state (isPaused, playTimestamp, trackStartTime) |
| `SessionPlayingTracks` | Session state (currentTrack, shortEffectTrack) |
| `User` | User entity (id, role, sessions) |
| `TrackCollection` | Curated collection with tracks |
| `TrackCreation` / `TrackUpdate` | Request DTOs |
| `ChangeSessionPlayingTracksRequest` | Playback control DTO |
| `UploadAndCreateTracksFromYoutubeRequest` | YouTube upload DTO |

**Roles:**

```typescript
enum Role { MAESTRO = 'MAESTRO', MINSTREL = 'MINSTREL', ADMIN = 'ADMIN' }
```

### audio-file-uploader-api-contract

Path alias: `@rpg-maestro/audio-file-uploader-api-contract`

| Type | Purpose |
|------|---------|
| `UploadAudioFromYoutubeRequest` | `{ urls: string[] }` |
| `UploadAudioFromYoutubeJobDto` | Job status DTO |

### test-utils

Path alias: `@rpg-maestro/test-utils`

| Export | Purpose |
|--------|---------|
| `generateFakeJwtToken()` | RS256-signed fake JWT for testing |
| `initUsersFixture()` | Creates 5 test users via API |
| `getJWKS()` | JWKS response for fake IDP |
| `randomEmail()` | Random email generator |

---

## Database Layer

The system uses a **pluggable database pattern** controlled by `DATABASE` env var.

```
DatabaseModule
  DatabaseWrapperConfiguration(process.env.DATABASE)
    ├── 'in-memory' → InMemory{Tracks,Users,TrackCollection}Database
    └── 'firestore' → Firestore{Tracks,Users,TrackCollections}Database
```

**Firestore collections (production):**

| Collection | Contents |
|-----------|----------|
| `rpg-maestro-sessions` | `SessionPlayingTracks` keyed by sessionId |
| `rpg-maestro-tracks` | `Track` entities |
| `rpg-maestro-users` | `User` entities |
| `rpg-maestro-track-collections` | `TrackCollection` entities |

**Adding a new DB entity:** implement the interface in both `in-memory/` and `firestore/`, register in `DatabaseModule`, expose via `DatabaseWrapperConfiguration`.

---

## Authentication Flow

### Production (Auth0)

```
Browser                       Backend
  │                              │
  ├─ Auth0 login flow            │
  ├─ getAccessTokenSilently()    │
  ├─ PUT /maestro/... ──────────►│
  │   Authorization: Bearer JWT  │
  │                              ├─ JwtAuthGuard
  │                              │   createRemoteJWKSet(AUTH_ISSUER/.well-known/jwks.json)
  │                              │   jwtVerify(token, jwks, { issuer, audience })
  │                              │   → email as UserID
  │                              ├─ RolesGuard
  │                              │   user.role ∈ @Roles([...])
  │                              └─ Handler
```

### Development (Fake IDP)

```
Browser                       Backend
  │                              │
  ├─ /dev/fake-idp-login-page    │
  ├─ POST /test-utils/fake-idp   │ ← generates RS256 keypair
  ├─ token returned              │
  ├─ authenticatedFetch()        │
  │   Authorization: Bearer JWT  │
  │                              ├─ JwtAuthGuard
  │                              │   GET /test-utils/fake-idp (JWKS)
  │                              │   jwtVerify(token, localJWKS)
  │                              └─ Handler
```

**JWT claims:** `email` (UserID), `sub`, `aud`, `iss`, `exp` (10 min), `iat`

---

## Real-Time Playback (Polling)

No WebSockets. Audience pages poll `/sessions/:id/playing-tracks` every N seconds.
Maestro writes state via `PUT /maestro/sessions/:sessionId/playing-tracks`.

**`PlayingTrack` fields enable client-side sync:**
- `playTimestamp` — wall-clock time when playback started
- `trackStartTime` — position in seconds where playback began
- `isPaused` — pause state

Client reconstructs current position as `(Date.now() - playTimestamp) / 1000 + trackStartTime`.

---

## CI/CD

### GitHub Actions

| Workflow | Trigger | Steps |
|----------|---------|-------|
| `main.yaml` | push to main | lint → test → deploy (Docker Hub) + webhook |
| `pull_request.yaml` | PR open/sync | lint → test |

**Nx target dependency chain:** `build` → `lint` → `test` → `e2e`

### Docker Images

| App | Base | Extra |
|-----|------|-------|
| `rpg-maestro` | `node:22-alpine` | `apk add ffmpeg` |
| `audio-file-uploader` | `node:22-alpine` | — |
| `rpg-maestro-ui` | `node:22-alpine` | Nginx or static |

**Build:** `npx nx docker-build <project>`  
**Push:** `npx nx deploy <project>` (pushes to `acevedor/<project>:latest`)

---

## Key Architectural Decisions

| Decision | Rationale |
|----------|-----------|
| Nx monorepo | Shared types, atomic releases, affected-only CI |
| Pluggable DB (in-memory / Firestore) | Fast local dev without cloud deps |
| Separate audio-file-uploader service | Isolates FFmpeg/ytdl complexity + heavy file I/O |
| Shared API contracts in libs | Single source of truth, compile-time type safety |
| Polling for real-time sync | Simpler than WebSockets; acceptable latency for RPG use case |
| Fake IDP for dev | No Auth0 tenant required for local dev |
| MUI dark theme | Fits the RPG atmosphere; consistent component library |
| Role enum (MAESTRO/MINSTREL/ADMIN) | Granular access control without OAuth scopes |
