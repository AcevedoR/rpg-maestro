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
              │ PUT playing-tracks                 │ SSE playing-tracks/stream (+ fallback poll)
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
├── ClockModule             ServerClock — the clock playback timestamps are stamped in (global)
├── DatabaseModule          DB provider (in-memory | firestore)
├── MaestroApiModule        Track CRUD, YouTube uploads, playback state
│   ├── TrackService
│   ├── ManageCurrentlyPlayingTracks
│   ├── OnboardingService
│   └── TrackCreationFromYoutubeJobsWatcher
├── SessionsModule          Session state + SessionEventsService (push fanout)
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
| `PlayersController` | `/` — incl. `/server-time` and `/sessions/:id/playing-tracks/stream` (SSE) | None |
| `HealthController` | `/health` — status, plus `playback` diagnostics (clock reference, offset, open streams) | None |
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
| `ServerTime` | `{ serverTime }` — the clock `playTimestamp` is expressed in |
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

## Caching Layer

Read-through caches sit in front of Firestore to stay under its quotas, since audience pages poll
continuously. `SessionsCache` (`rpg_maestro_sessions`) and `UsersCache` (`rpg_maestro_users`) both
have a 1 day TTL and wrap `ResilientCache`
(`infrastructure/cache/resilient-cache.ts`).

**One active tier at a time.** Backends are declared in priority order and the first healthy one
serves everything. There is no cascade between them: a miss on the active tier is a miss, and the
caller goes to the database.

```
CACHE_REDIS_URL           → 'redis'           self-hosted, primary
CACHE_FALLBACK_REDIS_URL  → 'redis-fallback'  managed service, used while the primary is down
neither set               → 'in-memory'       in-process Keyv (local dev, e2e tests)

get(key):  active tier ? (hit → return | miss → caller hits DB, then set) : caller hits DB
```

When every configured tier is down the cache degrades to **no cache at all**, not to a slower one —
the database absorbs the traffic until a tier comes back.

**Health switching.** `FAILURE_THRESHOLD` consecutive failures take a tier out of rotation for
`PROBE_INTERVAL_MS`; after that the next operation probes it. Without this, an outage that lasts
hours would cost a connection timeout on every single request.

**Every tier operation is bounded by `TIER_OPERATION_TIMEOUT_MS`, and a timeout counts as a
failure.** This is what makes the degradation above real: an unreachable Redis does not reject, it
*queues* commands in node-redis until the connection is back, so without a deadline nothing ever
fails, no tier is ever taken out of rotation, and callers wait instead of reaching the database. The
deadline is short on purpose — a cache hit slower than Firestore is worthless.

**Two rules keep a dormant tier from waking up with stale data**, given that writes only ever reach
the active tier:

1. *Write to one, delete from all* — a `set` also invalidates the key on every other healthy tier.
   Tiers in cooldown are skipped on purpose; rule 2 covers them.
2. *Clear on recovery* — a tier that failed and later comes back missed every invalidation during
   the outage, so its namespace is cleared before it serves anything. The clear doubles as the
   connectivity probe. A tier that was never unhealthy is not cleared, so deploys keep a warm cache.

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

## Real-Time Playback (SSE push, with polling as a safety net)

The Maestro writes state via `PUT /maestro/sessions/:sessionId/playing-tracks`. Listeners get it
pushed over server-sent events, and poll only as a fallback.

**`PlayingTrack` fields enable client-side sync:**
- `playTimestamp` — time on the **server clock** when playback started
- `trackStartTime` — position in the track where playback began
- `isPaused` — pause state

Client reconstructs the position as `(serverNow() - playTimestamp) + trackStartTime`, modulo the
track duration.

### Push channel

```
Maestro's write                                        Listener's browser
      │                                                        │
      ▼                                                        │  EventSource
 SessionsService.upsertCurrentTrack                            │  GET /sessions/:id/playing-tracks/stream
      │ writes DB + cache                                      ▼
      └─► SessionEventsService.publish ──► broker ──► every instance ──► @Sse handler
                                             │                            (snapshot, then changes,
   CACHE_REDIS_URL set  → redis pub/sub ─────┘                             plus a 20s heartbeat)
   nothing set          → in-process (single instance only)
```

- **SSE, not WebSocket**: everything flows server→client, and a plain GET needs no sticky sessions —
  any instance can serve any listener because the fanout is in the broker.
- **Fanout over Redis pub/sub** (`sessions/redis-session-events.broker.ts`), one channel for all
  sessions, filtered by session id on receipt. Track changes are rare enough that per-session channels
  would only add a subscribe/unsubscribe dance per stream.
- **Events are whole snapshots**, so a dropped event costs nothing once the next one lands, and the
  client runs the same `resolveSync` for pushed and polled state.
- **The poll stays** at `SYNC_TRACK_FALLBACK_INTERVAL_MS` (15s) while the stream is up, and at
  `SYNC_TRACK_INTERVAL_MS` (1s) while it is down. Losing the push path degrades latency, never
  correctness — which is also why nothing in the publish path can fail a Maestro's write.
- **Observability.** `GET /health` reports `playback.clockOffsetMs`, `playback.clockReference` and
  `playback.openStreams`. Skew and stream load are otherwise invisible: neither raises an error, and
  both are only noticed by a listener saying the music is out of sync. `openStreams` is the number to
  watch against an instance's concurrency limit, since a stream holds its connection for as long as a
  listener stays on the page.

### Time authority

`playTimestamp` is meaningless unless everyone agrees on the clock it was stamped in. Two skews had to
be removed, and they need different answers:

| Skew | Answer |
|------|--------|
| Between instances — a change stamped by pod A, the next by pod B | **Server-authoritative clock.** `ServerClock` (`infrastructure/clock/`) corrects the local clock against a single reference: Redis' `TIME`, NTP-style, best-of-5-samples, resynced every 30s. Every pod then stamps the same instant. |
| Between server and browser — laptop clocks are routinely seconds off | **Client-negotiated offset.** The browser measures its offset against `GET /server-time` (same estimator, resynced every 5 min) and `serverNow()` returns the corrected clock. `getCurrentPlayTime(serverNowMs)` takes it as an argument, so no caller can silently reach for `Date.now()`. |

Redis is the reference because it is already the piece every instance shares, and `TIME` costs no
write — unlike a database server timestamp. With no Redis configured (local dev, e2e, single instance)
the offset stays 0 and the local clock is the authority, which is correct there: there is only one
clock in play. If the reference is unreachable the last known offset is kept, so playback drifts at
worst rather than stopping.

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
| SSE push + slow fallback poll | Polling alone scales with the number of listeners; SSE needs no sticky sessions, and the poll left underneath means a cut stream costs latency, not correctness |
| Redis `TIME` as the playback clock | Instance clocks drift apart, and that drift is audible. Redis is already shared by every instance and needs no write to be read, unlike a DB server timestamp |
| Clients negotiate their own clock offset | Even one instance cannot fix a listener's own clock being seconds off, and that error lands straight on the playhead |
| Fake IDP for dev | No Auth0 tenant required for local dev |
| MUI dark theme | Fits the RPG atmosphere; consistent component library |
| Role enum (MAESTRO/MINSTREL/ADMIN) | Granular access control without OAuth scopes |
| One active cache tier, no cascade | A Redis outage lasts hours here; dual-writing every tier costs latency on every request to guard against a rare event. Health switching + clear-on-recovery gets the same safety |
