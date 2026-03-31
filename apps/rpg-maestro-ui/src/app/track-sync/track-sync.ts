import { getSessionPlayingTracks } from '../tracks-api';
import { PlayingTrack, SessionPlayingTracks } from '@rpg-maestro/rpg-maestro-api-contract';
import { AbortedRequestError } from '../maestro-ui/maestro-api';

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
 */
export const resyncIfNeeded = async (
  sessionId: string,
  currentTrackPlayTime: number | null,
  currentTrack: PlayingTrack | null,
  localShortEffectTrack: PlayingTrack | null,
): Promise<SyncResult | AbortedRequestError> => {
  const serverState = await getSessionPlayingTracks(sessionId);
  if (serverState === 'AbortedRequestError') {
    return serverState;
  }

  const newCurrentTrack = resolveCurrentTrackSync(currentTrackPlayTime, currentTrack, serverState);
  const newShortEffect = resolveShortEffectSync(localShortEffectTrack, serverState.shortEffectTrack);

  return { currentTrack: newCurrentTrack, shortEffectTrack: newShortEffect };
};

function resolveCurrentTrackSync(
  currentTrackPlayTime: number | null,
  currentTrack: PlayingTrack | null,
  serverState: SessionPlayingTracks,
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
    isCurrentTrackTooMuchDesynchronizedFromServer(currentTrackPlayTime * 1000, serverTrack)
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
  if (!localEffectTrack || localEffectTrack.playTimestamp !== serverEffectTrack.playTimestamp) {
    return serverEffectTrack;
  }
  return null;
}

export const isCurrentTrackTooMuchDesynchronizedFromServer = (
  currentTrackPlayTime: number,
  serverTrack: PlayingTrack
): boolean => {
  const serverPlayTime = serverTrack.getCurrentPlayTime();
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
