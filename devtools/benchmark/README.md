# Benchmark: concurrent sessions (1 GM + 5 players each)

Simulates real RPG Maestro sessions end to end against a locally running backend:

- **GM**: onboards as a fresh user (`POST /maestro/onboard`, seeded with the `default`
  track collection), then every 2–6 s either **changes the current track** (60 %) or
  **pauses/resumes it** (40 %) via `PUT /maestro/sessions/:id/playing-tracks`.
- **Players (5 per session)**: sync the server clock (`GET /server-time`) and listen on
  the real SSE push channel (`GET /sessions/:id/playing-tracks/stream`), exactly like
  the player UI.

No dependencies — plain Node ≥ 20.

## Running

Start the backend in a non-production env (the benchmark authenticates through the
`/test-utils` fake IDP, which is disabled in production):

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

Options:

| Flag | Default | Meaning |
|---|---|---|
| `--sessions N` | `1` | Concurrent sessions (each = 1 GM + players) |
| `--all` | off | Run the 1 / 5 / 20 scenarios back to back and print a comparison |
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

- Each session gets its own GM user, so sessions share no state.
- Tokens from the fake IDP expire after 10 minutes — keep `--duration` under that.
- The 20-session scenario opens 120 concurrent SSE connections from one Node process;
  raise `ulimit -n` if you push far beyond that.
