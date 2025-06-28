import { displayError } from '../error-utils';
import {
  ChangeSessionPlayingTracksRequest,
  PlayingTrack,
  SessionPlayingTracks,
  Track,
  TrackCreation,
  TrackCreationFromYoutubeDto,
  TrackUpdate,
  UploadAndCreateTracksFromYoutubeRequest, User
} from '@rpg-maestro/rpg-maestro-api-contract';

const rpgmaestroapiurl = import.meta.env.VITE_RPG_MAESTRO_API_URL; // TODO centralize

export const getAllTracks = async (sessionId: string): Promise<Track[]> => {
  try {
    const response = await fetch(rpgmaestroapiurl + `/maestro/sessions/${sessionId}/tracks`, {
      credentials: 'include',
    });
    if (response.ok) {
      return (await response.json()) as Track[];
    } else {
      console.error(response.status, response.statusText);
      console.error(response);
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
): Promise<SessionPlayingTracks> => {
  try {
    const response = await fetch(`${rpgmaestroapiurl}/maestro/sessions/${sessionId}/playing-tracks`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(changeSessionPlayingTracksRequest),
      credentials: 'include',
    });
    if (!response.ok) {
      console.error(response.status, response.statusText);
      throw new Error('fetch failed for error: ' + response);
    } else {
      const rawSerialized = (await response.json()) as SessionPlayingTracks;
      return {
        sessionId: rawSerialized.sessionId,
        currentTrack: !rawSerialized.currentTrack ? null : new PlayingTrack(
          rawSerialized.currentTrack.id,
          rawSerialized.currentTrack.name,
          rawSerialized.currentTrack.url,
          rawSerialized.currentTrack.duration,
          rawSerialized.currentTrack.isPaused,
          rawSerialized.currentTrack.playTimestamp,
          rawSerialized.currentTrack.trackStartTime
        ),
      };
    }
  } catch (error) {
    console.error(error);
    displayError(`Fetch /maestro/sessions/${sessionId}/playing-tracks error: ${JSON.stringify(error)}`);
    return Promise.reject();
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
      credentials: 'include',
    });
    if (!response.ok) {
      console.error(response.status, response.statusText);
      throw new Error('fetch failed for error: ' + response);
    }
    return (await response.json()) as Track;
  } catch (error) {
    console.error(error);
    displayError(`Fetch error: ${JSON.stringify(error)}`);
    return Promise.reject();
  }
};

export const createTrackFromYoutube = async (sessionId: string, url: string): Promise<void> => {
  try {
    const request: UploadAndCreateTracksFromYoutubeRequest = { urls: [url] };
    const response = await fetch(`${rpgmaestroapiurl}/maestro/sessions/${sessionId}/tracks/from-youtube`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(request),
      credentials: 'include',
      signal: AbortSignal.timeout(60 * 60 * 1000),
    });
    if (!response.ok) {
      console.error(response.status, response.statusText);
      throw new Error('fetch failed for error: ' + response);
    }
    return;
  } catch (error) {
    console.error(error);
    displayError(`Fetch error: ${JSON.stringify(error)}`);
    return Promise.reject();
  }
};

export const getTrackCreationFromYoutube = async (sessionId: string): Promise<TrackCreationFromYoutubeDto[]> => {
  try {
    const response = await fetch(`${rpgmaestroapiurl}/maestro/sessions/${sessionId}/tracks/from-youtube`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      credentials: 'include',
    });
    if (!response.ok) {
      console.error(response.status, response.statusText);
      throw new Error('fetch failed for error: ' + response);
    }
    const rawDatas = (await response.json()) as TrackCreationFromYoutubeDto[];
    return rawDatas.map(
      (rawData) =>
        new TrackCreationFromYoutubeDto(
          rawData.id,
          rawData.sessionId,
          rawData.status,
          rawData.youtubeUrlToUpload,
          rawData.error,
          rawData.uploadedFile,
          rawData.uploadedFileLink,
          rawData.trackName,
          rawData.trackId,
          new Date(rawData.createdDate),
          new Date(rawData.updatedDate)
        )
    );
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
      credentials: 'include',
    });
    if (!response.ok) {
      console.error(response.status, response.statusText);
      throw new Error('fetch failed for error: ' + response);
    }
    return (await response.json()) as Track;
  } catch (error) {
    console.error(error);
    displayError(`Fetch error: ${JSON.stringify(error)}`);
    return Promise.reject();
  }
};


export type UserAlreadyExistsError = "UserAlreadyExistsError";
export const onboard = async (): Promise<SessionPlayingTracks | UserAlreadyExistsError > => {
  try {
    const response = await fetch(`${rpgmaestroapiurl}/maestro/onboard`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      credentials: 'include',
    });
    if (!response.ok) {
      if(response.status === 409){
        return 'UserAlreadyExistsError';
      }
      console.error(response.status, response.statusText);
      throw new Error('fetch failed for error: ' + response);
    }
    return (await response.json()) as SessionPlayingTracks;
  } catch (error) {
    console.error(error);
    displayError(`Fetch error: ${JSON.stringify(error)}`);
    return Promise.reject();
  }
};

export const getMaestroInfos = async(): Promise<User> => {
  try {
    const response = await fetch(`${rpgmaestroapiurl}/maestro`, {
      credentials: 'include',
    });
    if (!response.ok) {
      console.error(response.status, response.statusText);
      throw new Error('fetch failed for error: ' + response);
    }
    return (await response.json()) as User;
  } catch (error) {
    console.error(error);
    displayError(`Fetch error: ${JSON.stringify(error)}`);
    return Promise.reject();
  }
}