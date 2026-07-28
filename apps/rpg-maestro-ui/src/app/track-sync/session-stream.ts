import { SessionPlayingTracks } from '@rpg-maestro/rpg-maestro-api-contract';
import { deserializeSessionPlayingTracks } from '../tracks-api';
import { rpgMaestroApiUrl } from '../utils/api-config';

/**
 * The server-sent-events stream of a session's playing tracks.
 *
 * This is what keeps a room of listeners from each polling on their own: the server pushes a track
 * change once, to everyone. Polling stays in place as a safety net — see `SYNC_TRACK_INTERVAL_MS` in
 * the player UI — because a stream can be cut by anything between the browser and the app, and a
 * silent stream is indistinguishable from a session where nothing happens.
 */

/** The stream is a snapshot of the whole session state, matching what the poll returns. */
export const PLAYING_TRACKS_EVENT = 'playing-tracks';

/**
 * How long before a stream the browser gave up on is opened again. `EventSource` reconnects by itself
 * while the server is merely unreachable, but stops for good on an HTTP error — a 404 for a session
 * the Maestro has not created yet, most importantly.
 */
export const RECONNECT_DELAY_MS = 10000;

export type SessionStreamStatus = 'connected' | 'disconnected';

export interface SessionStreamHandlers {
  onTracks: (tracks: SessionPlayingTracks) => void;
  /** Called on every change, so the caller can slow its fallback poll down while the stream is up. */
  onStatusChange: (status: SessionStreamStatus) => void;
}

/**
 * Streams a session's playing tracks. Returns the function that stops it — the caller must call it,
 * or the browser keeps the connection and its reconnect loop alive.
 */
export function subscribeToSessionPlayingTracks(sessionId: string, handlers: SessionStreamHandlers): () => void {
  let stopped = false;
  let source: EventSource | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  const open = () => {
    if (stopped) {
      return;
    }
    source = new EventSource(`${rpgMaestroApiUrl}/sessions/${sessionId}/playing-tracks/stream`);

    source.onopen = () => handlers.onStatusChange('connected');

    source.addEventListener(PLAYING_TRACKS_EVENT, (event) => {
      try {
        handlers.onTracks(deserializeSessionPlayingTracks(JSON.parse((event as MessageEvent<string>).data)));
      } catch (error) {
        console.warn('dropping an unreadable playing-tracks event', error);
      }
    });

    source.onerror = () => {
      handlers.onStatusChange('disconnected');
      // No error is surfaced to the user: the fallback poll covers this, and a listener who can still
      // hear the music has nothing to act on.
      if (source?.readyState === EventSource.CLOSED) {
        source.close();
        source = null;
        reconnectTimer = setTimeout(open, RECONNECT_DELAY_MS);
      }
    };
  };

  open();

  return () => {
    stopped = true;
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
    }
    source?.close();
    source = null;
  };
}
