import { displayError } from './error-utils';
import { PlayingTrack, SessionPlayingTracks } from '@rpg-maestro/rpg-maestro-api-contract';

const rpgmaestroapiurl = import.meta.env.VITE_RPG_MAESTRO_API_URL;
console.info('using api: ' + rpgmaestroapiurl);

export const getCurrentTrack = async (sessionId: string): Promise<PlayingTrack | null> => {
  try {
    const response = await fetch(`${rpgmaestroapiurl}/sessions/${sessionId}/playing-tracks`);
    if (response.ok) {
      const res = (await response.json()) as SessionPlayingTracks;
      const track = res.currentTrack;
      if(track != null){
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
        return null;
      }

    } else {
      console.error(response.status, response.statusText);
      console.error(response);
      throw new Error('fetch failed for error: ' + response);
    }
  } catch (error) {
    console.error(error);
    displayError(`Fetch current/tracks error: ${error}`);
    return null;
  }
};
