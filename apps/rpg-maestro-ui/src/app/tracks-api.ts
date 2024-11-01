import { PlayingTrack } from './PlayingTrack';
import { displayError } from './error-utils';
import { Track } from './Track';

const rpgmaestroapiurl = import.meta.env.VITE_RPG_MAESTRO_API_URL;
console.log('using api: ' + rpgmaestroapiurl);

export const getCurrentTrack = async (): Promise<PlayingTrack | null> => {
  try {
    const response = await fetch(rpgmaestroapiurl + '/sessions/current/tracks');
    if (response.ok) {
      const res = (await response.json()) as PlayingTrack;
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
export const getAllTracks = async (): Promise<Track[]> => {
  try {
    const response = await fetch(rpgmaestroapiurl + '/admin/tracks');
    if (response.ok) {
      return (await response.json()) as Track[];
    } else {
      console.log(response.status, response.statusText);
      console.debug(response);
      throw new Error('fetch failed for error: ' + response);
    }
  } catch (error) {
    console.error(error);
    displayError(`Fetch /admin/tracks error: ${error}`);
    return [];
  }
};
