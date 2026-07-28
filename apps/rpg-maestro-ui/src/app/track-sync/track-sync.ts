import { getSessionPlayingTracks } from '../tracks-api';
import { PlayingTrack, SessionPlayingTracks } from '@rpg-maestro/rpg-maestro-api-contract';
import { AbortedRequestError, SessionNotFoundError } from '../maestro-ui/maestro-api';

export interface SyncResult {
  currentTrack: PlayingTrack | null;
  shortEffectTrack: PlayingTrack | null;
}

/**
 *
 * @param sessionId
 * @param currentTrackPlayTime the requested play time of the track
 * @param currentTrack the current track in the browser
 * @param localShortEffectTrack the current short effect track in the browser
 * @param serverNowMs the current time on the server clock, see `utils/server-time.ts`
 */
export const resyncIfNeeded = async (
  sessionId: string,
  currentTrackPlayTime: number | null,
  currentTrack: PlayingTrack | null,
  localShortEffectTrack: PlayingTrack | null,
  serverNowMs: number
): Promise<SyncResult | AbortedRequestError | SessionNotFoundError> => {
  const serverState = await getSessionPlayingTracks(sessionId);
  if (serverState === 'AbortedRequestError' || serverState === 'SessionNotFoundError') {
    return serverState;
  }

  return resolveSync(serverState, currentTrackPlayTime, currentTrack, localShortEffectTrack, serverNowMs);
};

/**
 * What the browser has to change to match the server, given a state it already holds.
 *
 * Split out of the fetch above because that state now arrives two ways — pushed over the stream, or
 * pulled by the fallback poll — and both have to decide identically. A pushed event taking a different
 * path here would show up as playback that is right or wrong depending on how it was delivered.
 */
export function resolveSync(
  serverState: SessionPlayingTracks,
  currentTrackPlayTime: number | null,
  currentTrack: PlayingTrack | null,
  localShortEffectTrack: PlayingTrack | null,
  serverNowMs: number
): SyncResult {
  return {
    currentTrack: resolveCurrentTrackSync(currentTrackPlayTime, currentTrack, serverState, serverNowMs),
    shortEffectTrack: resolveShortEffectSync(localShortEffectTrack, serverState.shortEffectTrack),
  };
}

function resolveCurrentTrackSync(
  currentTrackPlayTime: number | null,
  currentTrack: PlayingTrack | null,
  serverState: SessionPlayingTracks,
  serverNowMs: number
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
    isCurrentTrackTooMuchDesynchronizedFromServer(currentTrackPlayTime * 1000, serverTrack, serverNowMs)
  ) {
    return serverTrack;
  }
  return null;
}

function resolveShortEffectSync(
  localEffectTrack: PlayingTrack | null,
  serverEffectTrack: PlayingTrack | null
): PlayingTrack | null {
  if (!serverEffectTrack) {
    return null;
  }
  if (!localEffectTrack || localEffectTrack.playTimestamp !== serverEffectTrack.playTimestamp) {
    return serverEffectTrack;
  }
  return null;
}

export const isCurrentTrackTooMuchDesynchronizedFromServer = (
  currentTrackPlayTime: number,
  serverTrack: PlayingTrack,
  serverNowMs: number
): boolean => {
  const serverPlayTime = serverTrack.getCurrentPlayTime(serverNowMs);
  if (!serverPlayTime && serverPlayTime !== 0) {
    return false;
  }
  const desyncTime = Math.abs(currentTrackPlayTime - serverPlayTime);
  if (desyncTime > 5000) {
    console.warn(
      `CurrentTrackTooMuchDesynchronizedFromServer by ${desyncTime}ms, current: ${currentTrackPlayTime} vs server: ${serverPlayTime}`
    );
    return true;
  } else {
    return false;
  }
};
export const isCurrentTrackOutOfDate = (currentTrack: PlayingTrack, serverTrack: PlayingTrack): boolean => {
  if (currentTrack.id !== serverTrack.id) {
    console.info('CurrentTrackOutOfDate: track have changed');
    return true;
  } else if (currentTrack.isPaused !== serverTrack.isPaused) {
    console.info('CurrentTrackOutOfDate: track paused status have changed');
    return true;
  } else if (currentTrack.playTimestamp !== serverTrack.playTimestamp) {
    console.info('CurrentTrackOutOfDate: track playTimestamp have changed');
    return true;
  }
  return false;
};
