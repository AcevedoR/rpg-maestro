import { displayError } from '../error-utils';
import {
  ChangeSessionPlayingTracksRequest,
  Track,
  TrackCreation,
  TrackUpdate,
} from '@rpg-maestro/rpg-maestro-api-contract';

const rpgmaestroapiurl = import.meta.env.VITE_RPG_MAESTRO_API_URL; // TODO centralize

export const getAllTracks = async (sessionId: string): Promise<Track[]> => {
  try {
    const response = await fetch(rpgmaestroapiurl + `/maestro/sessions/${sessionId}/tracks`);
    if (response.ok) {
      return (await response.json()) as Track[];
    } else {
      console.log(response.status, response.statusText);
      console.debug(response);
      throw new Error('fetch failed for error: ' + response);
    }
  } catch (error) {
    console.error(error);
    displayError(`Fetch /maestro/sessions/${sessionId}/tracks error: ${error}`);
    return [];
  }
};

export const setTrackToPlay = async (
  sessionId: string,
  changeSessionPlayingTracksRequest: ChangeSessionPlayingTracksRequest
): Promise<void> => {
  try {
    const response = await fetch(`${rpgmaestroapiurl}/maestro/sessions/${sessionId}/playing-tracks`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(changeSessionPlayingTracksRequest),
    });
    if (!response.ok) {
      console.log(response.status, response.statusText);
      throw new Error('fetch failed for error: ' + response);
    }
  } catch (error) {
    console.error(error);
    displayError(`Fetch /maestro/sessions/${sessionId}/playing-tracks error: ${JSON.stringify(error)}`);
  }
};

export const createTrack = async (sessionId: string, trackCreation: TrackCreation): Promise<Track> => {
  try {
    const response = await fetch(`${rpgmaestroapiurl}/maestro/sessions/${sessionId}/tracks`, {
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

export const updateTrack = async (sessionId: string, trackId: string, trackUpdate: TrackUpdate): Promise<Track> => {
  try {
    const response = await fetch(`${rpgmaestroapiurl}/maestro/sessions/${sessionId}/tracks/${trackId}`, {
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