import { getCurrentTrack } from '../tracks-api';
import { PlayingTrack } from '@rpg-maestro/rpg-maestro-api-contract';

export const resyncCurrentTrackIfNeeded = async (
  sessionId: string,
  currentTrackPlayTime: number | null,
  currentTrack: PlayingTrack | null
): Promise<PlayingTrack | null> => {
  const optServerTrack = await getCurrentTrack(sessionId);
  if (!optServerTrack) {
    return null;
  }
  if (
    currentTrackPlayTime === null ||
    currentTrackPlayTime === undefined ||
    !currentTrack ||
    isCurrentTrackOutOfDate(currentTrack, optServerTrack) ||
    isCurrentTrackTooMuchDesynchronizedFromServer(currentTrackPlayTime * 1000, optServerTrack)
  ) {
    return optServerTrack;
  }
  return null;
};

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
