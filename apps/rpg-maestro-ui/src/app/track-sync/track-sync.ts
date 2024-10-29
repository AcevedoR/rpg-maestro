import { getCurrentTrack } from '../tracks-api';
import { PlayingTrack } from '../PlayingTrack';

export const resyncCurrentTrackIfNeeded = async (
  currentTrackPlayTime: number | null,
  currentTrack: PlayingTrack | null
): Promise<PlayingTrack | null> => {
  const optServerTrack = await getCurrentTrack();
  if (!optServerTrack) {
    return null;
  }
  if (
    currentTrackPlayTime === null ||
    currentTrackPlayTime === undefined ||
    !currentTrack ||
    isCurrentTrackOutOfDate(currentTrack, optServerTrack) ||
    isCurrentTrackTooMuchDesynchronizedFromServer(currentTrackPlayTime*1000, optServerTrack)
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
    console.log(`CurrentTrackTooMuchDesynchronizedFromServer by ${desyncTime}ms`);
    return true;
  } else {
    return false;
  }
};
export const isCurrentTrackOutOfDate = (currentTrack: PlayingTrack, serverTrack: PlayingTrack): boolean => {
  if (
    currentTrack.id !== serverTrack.id ||
    currentTrack.isPaused !== serverTrack.isPaused ||
    currentTrack.playTimestamp !== serverTrack.playTimestamp
  ) {
    console.log('CurrentTrackOutOfDate');
    return true;
  }
  return false;
};
