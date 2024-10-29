import { PlayingTrack } from './PlayingTrack';
import { displayError } from './error-utils';

export const getCurrentTrack = async (): Promise<PlayingTrack | null> => {
  try {
    const response = await fetch(
      'http://localhost:3000/sessions/current/tracks'
    );
    if (response.ok) {
      const res = await response.json() as PlayingTrack;
      return new PlayingTrack(
        res.id,
        res.name,
        res.url,
        res.duration,
        res.isPaused,
        res.playTimestamp,
        res.trackStartTime
      );
    } else {
      console.log(response.status, response.statusText);
      console.debug(response);
      throw new Error('fetch failed for error: ' + response);
    }
  } catch (error) {
    console.error(error);
    displayError(`Fetch current/tracks error: ${error}`);
    return null;
  }
};