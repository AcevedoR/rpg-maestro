import { displayError } from '../error-utils';
import { Track, TrackCreation, TrackToPlay, TrackUpdate } from '@rpg-maestro/rpg-maestro-api-contract';

const rpgmaestroapiurl = import.meta.env.VITE_RPG_MAESTRO_API_URL; // TODO centralize

export const setTrackToPlay = async (trackToPlay: TrackToPlay): Promise<void> => {
  try {
    const response = await fetch(`${rpgmaestroapiurl}/admin/sessions/current/tracks`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(trackToPlay),
    });
    if (!response.ok) {
      console.log(response.status, response.statusText);
      throw new Error('fetch failed for error: ' + response);
    }
  } catch (error) {
    console.error(error);
    displayError(`Fetch error: ${JSON.stringify(error)}`);
  }
};

export const createTrack = async (trackCreation: TrackCreation): Promise<Track> => {
  try {
    const response = await fetch(`${rpgmaestroapiurl}/admin/tracks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(trackCreation),
    });
    if (!response.ok) {
      console.log(response.status, response.statusText);
      throw new Error('fetch failed for error: ' + response);
    }
    return (await response.json()) as Track;
  } catch (error) {
    console.error(error);
    displayError(`Fetch error: ${JSON.stringify(error)}`);
    return Promise.reject();
  }
};

export const updateTrack = async (trackId: string, trackUpdate: TrackUpdate): Promise<Track> => {
  try {
    const response = await fetch(`${rpgmaestroapiurl}/admin/tracks/${trackId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(trackUpdate),
    });
    if (!response.ok) {
      console.log(response.status, response.statusText);
      throw new Error('fetch failed for error: ' + response);
    }
    return (await response.json()) as Track;
  } catch (error) {
    console.error(error);
    displayError(`Fetch error: ${JSON.stringify(error)}`);
    return Promise.reject();
  }
};
