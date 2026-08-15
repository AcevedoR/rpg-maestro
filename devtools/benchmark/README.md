# Benchmark: concurrent sessions (1 GM + 5 players each)

Simulates real RPG Maestro sessions end to end:

- **GM**: every 2–6 s either **changes the current track** (60 %, picked among the tracks
  the session already has) or **pauses/resumes it at the current playhead** (40 %) via
  `PUT /maestro/sessions/:id/playing-tracks`.
- **Players (5 per session)**: sync the server clock (`GET /server-time`) and listen on
  the real SSE push channel (`GET /sessions/:id/playing-tracks/stream`), exactly like
  the player UI.

No dependencies — plain Node ≥ 20.

## Safety: what the benchmark writes

In **both** modes, the only write the benchmark ever performs is
`PUT /maestro/sessions/:id/playing-tracks` — the same call the maestro soundboard makes.
It never creates, renames or deletes tracks, and never deletes sessions or users.

| Mode | Extra writes | Safe against prod? |
|---|---|---|
| Existing-session (`--session-id` + `--token`) | none — playback state only, **restored after the run** | ✅ yes |
| Self-provisioning (default) | creates throwaway users + sessions via `/test-utils` + `/maestro/onboard` | ❌ dev/e2e only (`/test-utils` is disabled in prod anyway) |

## Prod-safe mode (existing session)

Point it at one or more sessions **you own**, with a real maestro token:

```bash
node devtools/benchmark/bench.mjs \
  --base-url https://rpgmaestro.app/api \
  --session-id I7tyU8i \
  --token '<maestro JWT>'
```

- The session count is the number of `--session-id` values (repeatable or comma-separated),
  so a 5-session scenario needs 5 of your sessions.
- If the deployment needs a non-standard `Authorization` value (e.g. Cloudflare Access),
  pass it verbatim with `--auth-header '...'` instead of `--token`.
- When the run ends, each session is restored to the track/position/pause state it had
  before the benchmark started.
- Heads-up: it drives **real playback** — anyone listening to that session will hear the
  GM's track changes. Use a spare session.

## Self-provisioning mode (dev / e2e)

Each GM onboards as a fresh user (`POST /maestro/onboard`), seeded with the `default`
track collection — sessions share no state. Requires the `/test-utils` fake IDP, so start
the backend in a non-production env:

```bash
npx nx run rpg-maestro:dev-e2e   # backend on http://localhost:8099
```

Then, from the repo root:

```bash
npm run benchmark                          # 1 session (smoke)
npm run benchmark -- --sessions 5          # 5 concurrent sessions
npm run benchmark -- --sessions 20         # 20 concurrent sessions
npm run benchmark -- --all                 # 1, then 5, then 20 + comparison table
```

## Options

| Flag | Default | Meaning |
|---|---|---|
| `--sessions N` | `1` | Concurrent throwaway sessions (self-provisioning mode) |
| `--all` | off | Run the 1 / 5 / 20 scenarios back to back and print a comparison |
| `--session-id ID[,ID…]` | — | Existing-session mode: benchmark these sessions (repeatable) |
| `--token JWT` | — | Maestro bearer token for existing-session mode |
| `--auth-header VALUE` | — | Verbatim `Authorization` header value (overrides `--token`) |
| `--players N` | `5` | Players per session |
| `--duration S` | `60` | Seconds each scenario's GMs keep acting |
| `--base-url URL` | `http://localhost:8099` (or `BENCH_BASE_URL`) | Target backend |

## What is measured

| Metric | Meaning |
|---|---|
| GM command (PUT) latency | Round trip of the maestro's track-change / pause request |
| SSE propagation latency | GM sends the PUT → a player receives the `playing-tracks` event |
| Time to first snapshot | Stream open → opening state event received |
| events received / expected | Fan-out completeness (`GM actions × players`) |
| HTTP errors / stream drops | Failed requests and SSE connections that died mid-run |

Propagation latency is sequence-matched (the Nth change event a player receives is paired
with the GM's Nth command). SSE guarantees per-stream ordering, so this holds as long as
streams do not drop mid-scenario; treat propagation numbers with suspicion in a run that
reports drops.

## Notes

- Fake-IDP tokens (self-provisioning mode) expire after 10 minutes — keep `--duration`
  under that.
- The 20-session scenario opens 120 concurrent SSE connections from one Node process;
  raise `ulimit -n` if you push far beyond that.
