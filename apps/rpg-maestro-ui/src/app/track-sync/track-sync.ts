import { getSessionPlayingTracks } from '../tracks-api';
import { PlayingTrack, SessionPlayingTracksResponse } from '@rpg-maestro/rpg-maestro-api-contract';
import { AbortedRequestError, SessionNotFoundError } from '../maestro-ui/maestro-api';

export const MAX_ACCEPTABLE_DESYNC_MS = 5000;

export interface SyncResult {
  currentTrack: PlayingTrack | null;
  /**
   * Where to seek `currentTrack`, as resolved by the server. Only meaningful when `currentTrack` is set —
   * null means there is nothing to seek.
   *
   * Callers must use this rather than `currentTrack.getCurrentPlayTime()`: in a browser that method would
   * subtract a server-written timestamp from the local `Date.now()` and be wrong by the whole clock offset.
   */
  currentPlayTimeMs: number | null;
  shortEffectTrack: PlayingTrack | null;
}

/**
 *
 * @param sessionId
 * @param currentTrackPlayTime the play time of the track as it currently stands in the browser, in seconds
 * @param currentTrack the current track in the browser
 * @param localShortEffectTrack the current short effect track in the browser
 */
export const resyncIfNeeded = async (
  sessionId: string,
  currentTrackPlayTime: number | null,
  currentTrack: PlayingTrack | null,
  localShortEffectTrack: PlayingTrack | null,
): Promise<SyncResult | AbortedRequestError | SessionNotFoundError> => {
  const serverState = await getSessionPlayingTracks(sessionId);
  if (serverState === 'AbortedRequestError' || serverState === 'SessionNotFoundError') {
    return serverState;
  }

  const newCurrentTrack = resolveCurrentTrackSync(currentTrackPlayTime, currentTrack, serverState);
  const newShortEffect = resolveShortEffectSync(localShortEffectTrack, serverState.shortEffectTrack);

  return {
    currentTrack: newCurrentTrack,
    currentPlayTimeMs: serverState.currentPlayTimeMs,
    shortEffectTrack: newShortEffect,
  };
};

function resolveCurrentTrackSync(
  currentTrackPlayTime: number | null,
  currentTrack: PlayingTrack | null,
  serverState: SessionPlayingTracksResponse,
): PlayingTrack | null {
  const serverTrack = serverState.currentTrack;
  if (!serverTrack) {
    return null;
  }
  if (
    currentTrackPlayTime === null ||
    currentTrackPlayTime === undefined ||
    !currentTrack ||
    isCurrentTrackOutOfDate(currentTrack, serverTrack) ||
    isCurrentTrackTooMuchDesynchronizedFromServer(currentTrackPlayTime * 1000, serverState.currentPlayTimeMs)
  ) {
    return serverTrack;
  }
  return null;
}

function resolveShortEffectSync(
  localEffectTrack: PlayingTrack | null,
  serverEffectTrack: PlayingTrack | null,
): PlayingTrack | null {
  if (!serverEffectTrack) {
    return null;
  }
  if (!localEffectTrack || localEffectTrack.revision !== serverEffectTrack.revision) {
    return serverEffectTrack;
  }
  return null;
}

/**
 * @param currentTrackPlayTime the browser's playhead, in ms
 * @param serverPlayTimeMs the server's playhead, in ms, already resolved against the server's own clock
 */
export const isCurrentTrackTooMuchDesynchronizedFromServer = (
  currentTrackPlayTime: number,
  serverPlayTimeMs: number | null
): boolean => {
  if (serverPlayTimeMs === null || serverPlayTimeMs === undefined) {
    return false;
  }
  const desyncTime = Math.abs(currentTrackPlayTime - serverPlayTimeMs);
  if (desyncTime > MAX_ACCEPTABLE_DESYNC_MS) {
    console.warn(
      `CurrentTrackTooMuchDesynchronizedFromServer by ${desyncTime}ms, current: ${currentTrackPlayTime} vs server: ${serverPlayTimeMs}`
    );
    return true;
  } else {
    return false;
  }
};

/**
 * Whether the server changed the current track since the browser last took a copy.
 *
 * Decided on `revision`, a counter the server bumps per write. It used to be decided on `playTimestamp`,
 * a wall-clock reading, which cannot order two writes made by two backend instances with skewed clocks.
 * The id and paused checks stay as a safety net for a server that failed to bump.
 */
export const isCurrentTrackOutOfDate = (currentTrack: PlayingTrack, serverTrack: PlayingTrack): boolean => {
  if (currentTrack.id !== serverTrack.id) {
    console.info('CurrentTrackOutOfDate: track have changed');
    return true;
  } else if (currentTrack.isPaused !== serverTrack.isPaused) {
    console.info('CurrentTrackOutOfDate: track paused status have changed');
    return true;
  } else if (currentTrack.revision !== serverTrack.revision) {
    console.info('CurrentTrackOutOfDate: track revision have changed');
    return true;
  }
  return false;
};
