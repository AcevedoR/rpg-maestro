import { displayError } from './error-utils';
import { PlayingTrack, SessionPlayingTracks } from '@rpg-maestro/rpg-maestro-api-contract';

const rpgmaestroapiurl = import.meta.env.VITE_RPG_MAESTRO_API_URL;
console.log('using api: ' + rpgmaestroapiurl);

export const getCurrentTrack = async (sessionId: string): Promise<PlayingTrack | null> => {
  try {
    const response = await fetch(`${rpgmaestroapiurl}/sessions/${sessionId}/playing-tracks`);
    if (response.ok) {
      const res = (await response.json()) as SessionPlayingTracks;
      const track = res.currentTrack;
      return new PlayingTrack(
        track.id,
        track.name,
        track.url,
        track.duration,
        track.isPaused,
        track.playTimestamp,
        track.trackStartTime
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
