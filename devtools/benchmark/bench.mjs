/**
 * RPG Maestro load benchmark — simulates full sessions: 1 GM + N players each.
 *
 * Two modes:
 *
 *  - Self-provisioning (dev/e2e only): each GM onboards as a fresh user
 *    (`POST /maestro/onboard`), which seeds a throwaway session with the `default`
 *    track collection. Needs the `/test-utils` fake IDP, which is disabled in prod.
 *
 *  - Existing-session (prod-safe): pass `--session-id` (repeatable) and `--token`
 *    (or `--auth-header`). The benchmark then runs against YOUR sessions and only
 *    ever issues reads plus `PUT /maestro/sessions/:id/playing-tracks` — it never
 *    creates, renames or deletes tracks, sessions or users, and it restores the
 *    playing state each session had before the run.
 *
 * Per session:
 *  - the GM randomly changes the current track (among the tracks the session already
 *    has) or pauses/resumes it at the current playhead, like a real maestro;
 *  - each player syncs the server clock (`GET /server-time`) and listens on the real
 *    SSE push channel (`GET /sessions/:id/playing-tracks/stream`), like the player UI.
 *
 * Measured:
 *  - GM command latency (PUT playing-tracks round trip)
 *  - SSE propagation latency (GM sends PUT -> player receives the change event)
 *  - time to first snapshot on stream open
 *  - stream drops / HTTP errors
 *
 * Zero dependencies — plain Node >= 20 (global fetch + web streams).
 *
 * Usage:
 *   node devtools/benchmark/bench.mjs --sessions 5            # dev/e2e, one scenario
 *   node devtools/benchmark/bench.mjs --all                   # dev/e2e: 1, then 5, then 20
 *   node devtools/benchmark/bench.mjs \
 *     --base-url https://rpgmaestro.app/api \
 *     --session-id I7tyU8i --token <maestro JWT>              # prod-safe
 */

const DEFAULTS = {
  baseUrl: process.env.BENCH_BASE_URL ?? 'http://localhost:8099',
  playersPerSession: 5,
  durationSec: 60,
  // GM acts every 2-6s: enough to exercise the push channel without being a DoS test.
  gmActionMinMs: 2000,
  gmActionMaxMs: 6000,
  changeTrackProbability: 0.6, // else: toggle pause
};

const SCENARIOS = [1, 5, 20];

// ---------------------------------------------------------------------------
// CLI

function parseArgs(argv) {
  const args = { ...DEFAULTS, sessions: undefined, all: false, sessionIds: [], token: undefined, authHeader: undefined };
  for (let i = 2; i < argv.length; i++) {
    const next = () => argv[++i];
    switch (argv[i]) {
      case '--sessions':
        args.sessions = Number(next());
        break;
      case '--players':
        args.playersPerSession = Number(next());
        break;
      case '--duration':
        args.durationSec = Number(next());
        break;
      case '--base-url':
        args.baseUrl = next();
        break;
      case '--session-id':
        args.sessionIds.push(...next().split(','));
        break;
      case '--token':
        args.token = next();
        break;
      case '--auth-header':
        args.authHeader = next();
        break;
      case '--all':
        args.all = true;
        break;
      case '--help':
        console.info(
          'Usage: bench.mjs [--sessions N | --all] [--players N] [--duration seconds] [--base-url URL]\n' +
            '       bench.mjs --session-id ID[,ID...] (--token JWT | --auth-header VALUE) [--players N] [--duration s]'
        );
        process.exit(0);
        break;
      default:
        throw new Error(`Unknown argument: ${argv[i]}`);
    }
  }
  if (args.sessionIds.length > 0) {
    if (args.all || args.sessions) {
      throw new Error('--session-id sets the session count itself; do not combine it with --sessions or --all');
    }
    if (!args.token && !args.authHeader) {
      throw new Error('existing-session mode needs --token (Bearer JWT) or --auth-header (verbatim Authorization value)');
    }
  } else if (!args.all && !args.sessions) {
    args.sessions = 1;
  }
  return args;
}

// ---------------------------------------------------------------------------
// Small helpers

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const randomBetween = (min, max) => min + Math.random() * (max - min);

function percentile(sortedValues, p) {
  if (sortedValues.length === 0) return NaN;
  const index = Math.min(sortedValues.length - 1, Math.ceil((p / 100) * sortedValues.length) - 1);
  return sortedValues[Math.max(0, index)];
}

function summarize(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return {
    count: sorted.length,
    p50: percentile(sorted, 50),
    p95: percentile(sorted, 95),
    p99: percentile(sorted, 99),
    max: sorted[sorted.length - 1] ?? NaN,
  };
}

function formatSummary(label, s) {
  const ms = (v) => (Number.isNaN(v) ? '  n/a' : `${v.toFixed(0)}ms`.padStart(7));
  return `  ${label.padEnd(28)} n=${String(s.count).padStart(5)}  p50=${ms(s.p50)}  p95=${ms(s.p95)}  p99=${ms(
    s.p99
  )}  max=${ms(s.max)}`;
}

async function fetchJsonOrThrow(url, options = {}) {
  const res = await fetch(url, options);
  if (!res.ok) {
    throw new Error(`${options.method ?? 'GET'} ${url} -> ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }
  return res.json();
}

// ---------------------------------------------------------------------------
// SSE client (players)

/**
 * Minimal text/event-stream reader. Calls onEvent(type, data, receivedAtMs) for each event.
 * Resolves when the stream ends or the signal aborts; rejects on connection failure.
 */
async function consumeSse(url, { signal, onEvent }) {
  const res = await fetch(url, { headers: { accept: 'text/event-stream' }, signal });
  if (!res.ok || !res.body) {
    throw new Error(`SSE ${url} -> ${res.status}`);
  }
  const decoder = new TextDecoder();
  let buffer = '';
  for await (const chunk of res.body) {
    buffer += decoder.decode(chunk, { stream: true });
    let separatorIndex;
    while ((separatorIndex = buffer.indexOf('\n\n')) !== -1) {
      const rawEvent = buffer.slice(0, separatorIndex);
      buffer = buffer.slice(separatorIndex + 2);
      let type = 'message';
      const dataLines = [];
      for (const line of rawEvent.split('\n')) {
        if (line.startsWith('event:')) type = line.slice(6).trim();
        else if (line.startsWith('data:')) dataLines.push(line.slice(5).trim());
      }
      if (dataLines.length > 0) onEvent(type, dataLines.join('\n'), Date.now());
    }
  }
}

// ---------------------------------------------------------------------------
// Session provisioning

/** Dev/e2e only: onboards a fresh throwaway GM user with its own seeded session. */
async function provisionThrowawaySession(baseUrl) {
  // Each call issues a unique `a_new_user` token, so every benchmark session gets its own GM.
  let fixtures;
  try {
    fixtures = await fetchJsonOrThrow(`${baseUrl}/test-utils/create-test-users-fixtures`, { method: 'POST' });
  } catch (error) {
    throw new Error(
      `could not self-provision a session (${error.message}). Against a production backend, ` +
        `use the prod-safe mode instead: --session-id <yourSession> --token <maestro JWT>`
    );
  }
  const authHeaders = { authorization: `Bearer ${fixtures.a_new_user.token}`, 'content-type': 'application/json' };
  const session = await fetchJsonOrThrow(`${baseUrl}/maestro/onboard`, { method: 'POST', headers: authHeaders });
  return { authHeaders, sessionId: session.sessionId, restoreStateAfterRun: false };
}

/** Prod-safe: attaches to a session that already exists and belongs to the token's user. */
async function attachToExistingSession(baseUrl, sessionId, args) {
  const authHeaders = {
    authorization: args.authHeader ?? `Bearer ${args.token}`,
    'content-type': 'application/json',
  };
  return { authHeaders, sessionId, restoreStateAfterRun: true };
}

// ---------------------------------------------------------------------------
// GM playhead math

/** Estimate of "now" on the server clock, from one /server-time sample. */
async function measureServerClock(baseUrl) {
  const before = Date.now();
  const { serverTime } = await fetchJsonOrThrow(`${baseUrl}/server-time`);
  const offset = serverTime - (before + (Date.now() - before) / 2);
  return () => Date.now() + offset;
}

/** Where the playhead of a PlayingTrack (as served by the API) is right now. */
function currentPlayhead(playingTrack, serverNowMs) {
  if (playingTrack.isPaused) return playingTrack.trackStartTime;
  const elapsed = Math.max(0, serverNowMs - playingTrack.playTimestamp);
  return (playingTrack.trackStartTime + elapsed) % playingTrack.duration;
}

// ---------------------------------------------------------------------------
// One benchmark session

/**
 * Starts the players, waits for their snapshots, then runs the GM action loop until
 * the deadline. The ONLY write it performs is PUT /maestro/sessions/:id/playing-tracks.
 */
async function runSession(provision, config, metrics) {
  const { baseUrl, playersPerSession, durationSec } = config;
  const { authHeaders, sessionId, restoreStateAfterRun } = await provision();

  // Read-only: the tracks the session already has, and what is playing right now.
  const tracks = await fetchJsonOrThrow(`${baseUrl}/maestro/sessions/${sessionId}/tracks`, { headers: authHeaders });
  if (tracks.length === 0) {
    throw new Error(`Session ${sessionId} has no tracks to play — add some before benchmarking it`);
  }
  const initialState = await fetchJsonOrThrow(`${baseUrl}/sessions/${sessionId}/playing-tracks`);
  const serverNow = await measureServerClock(baseUrl);

  // Ordered log of GM commands; SSE events are ordered per stream, so the Nth change
  // event a player receives (after its snapshot) matches the Nth command. Approximate —
  // good enough to spot propagation degradation across scenario sizes.
  const commands = [];
  const abort = new AbortController();

  const players = Array.from({ length: playersPerSession }, async (_, playerIndex) => {
    // Players sync the server clock first, like the real UI.
    await fetchJsonOrThrow(`${baseUrl}/server-time`);
    const openedAt = Date.now();
    let changeEventsSeen = 0;
    let snapshotSeen = false;
    try {
      await consumeSse(`${baseUrl}/sessions/${sessionId}/playing-tracks/stream`, {
        signal: abort.signal,
        onEvent: (type, _data, receivedAt) => {
          if (type !== 'playing-tracks') return; // ignore heartbeats
          if (!snapshotSeen) {
            snapshotSeen = true;
            metrics.snapshotMs.push(receivedAt - openedAt);
            return;
          }
          const command = commands[changeEventsSeen++];
          if (command) metrics.propagationMs.push(receivedAt - command.sentAt);
        },
      });
    } catch (error) {
      if (!abort.signal.aborted) {
        metrics.streamDrops++;
        console.warn(`  [${sessionId}] player ${playerIndex} stream dropped: ${error.message}`);
      }
    }
  });

  // Give players a moment to receive their opening snapshot before the GM starts acting.
  await sleep(1000);

  const putPlayingTracks = async (trackToPlay) => {
    const sentAt = Date.now();
    commands.push({ sentAt });
    const state = await fetchJsonOrThrow(`${baseUrl}/maestro/sessions/${sessionId}/playing-tracks`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({ currentTrack: trackToPlay }),
    });
    metrics.gmPutMs.push(Date.now() - sentAt);
    metrics.gmActions++;
    return state;
  };

  let playing = initialState.currentTrack; // PlayingTrack | null, refreshed from each PUT response
  const deadline = Date.now() + durationSec * 1000;
  while (Date.now() < deadline) {
    await sleep(randomBetween(config.gmActionMinMs, config.gmActionMaxMs));
    // Pause/resume needs a track to already be playing; otherwise change track first.
    const changeTrack = playing === null || Math.random() < config.changeTrackProbability;
    const action = changeTrack
      ? { trackId: tracks[Math.floor(Math.random() * tracks.length)].id, startTime: 0 }
      : { trackId: playing.id, startTime: currentPlayhead(playing, serverNow()), paused: !playing.isPaused };
    try {
      playing = (await putPlayingTracks(action)).currentTrack;
    } catch (error) {
      metrics.httpErrors++;
      console.warn(`  [${sessionId}] GM PUT failed: ${error.message}`);
    }
  }

  // Let in-flight events land before tearing the streams down.
  await sleep(1500);
  abort.abort();
  await Promise.allSettled(players);

  // On a real session, put back what was playing before the run (best effort, not measured).
  if (restoreStateAfterRun && initialState.currentTrack) {
    const original = initialState.currentTrack;
    try {
      await fetchJsonOrThrow(`${baseUrl}/maestro/sessions/${sessionId}/playing-tracks`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({
          currentTrack: { trackId: original.id, startTime: original.trackStartTime, paused: original.isPaused },
        }),
      });
      console.info(`  [${sessionId}] restored the pre-run playing state`);
    } catch (error) {
      console.warn(`  [${sessionId}] could not restore the pre-run playing state: ${error.message}`);
    }
  }
}

// ---------------------------------------------------------------------------
// Scenario runner

async function runScenario(config, provisioners) {
  const { playersPerSession, durationSec, baseUrl } = config;
  console.info(
    `\n=== Scenario: ${provisioners.length} session(s) x (1 GM + ${playersPerSession} players), ${durationSec}s, target ${baseUrl} ===`
  );

  const metrics = {
    gmPutMs: [],
    propagationMs: [],
    snapshotMs: [],
    gmActions: 0,
    httpErrors: 0,
    streamDrops: 0,
  };

  const startedAt = Date.now();
  const runs = [];
  for (const [i, provision] of provisioners.entries()) {
    runs.push(
      runSession(provision, config, metrics).catch((error) => {
        metrics.httpErrors++;
        console.error(`  session ${i} failed: ${error.message}`);
      })
    );
    await sleep(100); // stagger startups so setup is not a thundering herd
  }
  await Promise.all(runs);

  const result = {
    sessions: provisioners.length,
    gmPut: summarize(metrics.gmPutMs),
    propagation: summarize(metrics.propagationMs),
    snapshot: summarize(metrics.snapshotMs),
    gmActions: metrics.gmActions,
    eventsReceived: metrics.propagationMs.length,
    expectedEvents: metrics.gmActions * playersPerSession,
    httpErrors: metrics.httpErrors,
    streamDrops: metrics.streamDrops,
    wallClockSec: (Date.now() - startedAt) / 1000,
  };

  console.info(formatSummary('GM command (PUT) latency', result.gmPut));
  console.info(formatSummary('SSE propagation latency', result.propagation));
  console.info(formatSummary('Time to first snapshot', result.snapshot));
  console.info(
    `  GM actions: ${result.gmActions} | events received: ${result.eventsReceived}/${result.expectedEvents}` +
      ` | HTTP errors: ${result.httpErrors} | stream drops: ${result.streamDrops}`
  );
  return result;
}

function printComparison(results) {
  console.info('\n=== Comparison ===');
  console.info(
    'sessions | PUT p95 | propagation p95 | snapshot p95 | events recv/expected | errors | drops'
  );
  for (const r of results) {
    console.info(
      `${String(r.sessions).padStart(8)} | ${`${r.gmPut.p95.toFixed(0)}ms`.padStart(7)} | ${`${r.propagation.p95.toFixed(
        0
      )}ms`.padStart(15)} | ${`${r.snapshot.p95.toFixed(0)}ms`.padStart(12)} | ${`${r.eventsReceived}/${
        r.expectedEvents
      }`.padStart(20)} | ${String(r.httpErrors).padStart(6)} | ${String(r.streamDrops).padStart(5)}`
    );
  }
}

// ---------------------------------------------------------------------------

async function main() {
  const args = parseArgs(process.argv);

  try {
    await fetchJsonOrThrow(`${args.baseUrl}/health`);
  } catch {
    console.error(
      `Backend not reachable at ${args.baseUrl}. Start it first, e.g.: npx nx run rpg-maestro:dev-e2e` +
        ` (or pass --base-url).`
    );
    process.exit(1);
  }

  const results = [];
  if (args.sessionIds.length > 0) {
    console.info(
      `Existing-session mode (prod-safe): benchmarking ${args.sessionIds.length} session(s) you own. ` +
        `Only playback state is touched, and it is restored after the run.`
    );
    const provisioners = args.sessionIds.map((id) => () => attachToExistingSession(args.baseUrl, id, args));
    results.push(await runScenario(args, provisioners));
  } else {
    const scenarios = args.all ? SCENARIOS : [args.sessions];
    for (const sessions of scenarios) {
      const provisioners = Array.from({ length: sessions }, () => () => provisionThrowawaySession(args.baseUrl));
      results.push(await runScenario(args, provisioners));
    }
  }
  if (results.length > 1) printComparison(results);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
