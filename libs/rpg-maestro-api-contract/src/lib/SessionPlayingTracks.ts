import { PlayingTrack, rehydratePlayingTrack } from './PlayingTrack';
import { IsString, IsOptional, IsArray } from 'class-validator';

// TODO make this a real session, with create and update date
export interface SessionPlayingTracks {
  sessionId: SessionID;
  currentTrack: PlayingTrack | null;
  shortEffectTrack: PlayingTrack | null;
  /**
   * Monotonic counter bumped on every write to the session, whichever slot was written. Each write also
   * stamps the new value onto the track it wrote, so `currentTrack.revision` changes only when the
   * current track itself changed — playing a short effect does not make the music look stale.
   *
   * Doubles as the version for conditional writes (see the optimistic-concurrency issue) and as the SSE
   * event id once the push channel lands.
   */
  revision: number;
}

/**
 * What the API actually returns for a session: the stored state plus the playhead, resolved server-side.
 *
 * `currentPlayTimeMs` deliberately does NOT live on {@link SessionPlayingTracks}, because that shape is
 * what gets persisted and cached — a playhead cached for a day would be a day stale. It is computed at
 * the response boundary, per request, and only ever exists on the way out.
 */
export interface SessionPlayingTracksResponse extends SessionPlayingTracks {
  /** Playhead of `currentTrack` in ms at the moment the server answered, or null if nothing is playing. */
  currentPlayTimeMs: number | null;
}

/**
 * Resolve the playhead against the server's own clock. Call this at the response boundary, never before
 * caching or persisting.
 */
export function toSessionPlayingTracksResponse(
  session: SessionPlayingTracks,
  nowMs: number = Date.now()
): SessionPlayingTracksResponse {
  return {
    ...session,
    currentPlayTimeMs: session.currentTrack ? session.currentTrack.getCurrentPlayTime(nowMs) : null,
  };
}

/** See {@link rehydratePlayingTrack} — same problem, at session granularity. */
export function rehydrateSessionPlayingTracks(plain: SessionPlayingTracks): SessionPlayingTracks {
  return {
    sessionId: plain.sessionId,
    currentTrack: plain.currentTrack ? rehydratePlayingTrack(plain.currentTrack) : null,
    shortEffectTrack: plain.shortEffectTrack ? rehydratePlayingTrack(plain.shortEffectTrack) : null,
    revision: plain.revision ?? 0,
  };
}

export type SessionID = string;

export class CreateSession {

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  withTrackCollections?: string[];
}
