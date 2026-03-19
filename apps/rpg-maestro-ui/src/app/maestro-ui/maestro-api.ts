import { displayError } from '../error-utils';
import {
  ChangeSessionPlayingTracksRequest,
  PlayingTrack,
  SessionPlayingTracks,
  Track,
  TrackCreation,
  TrackCreationFromYoutubeDto,
  TrackCollection,
  TrackUpdate,
  UploadAndCreateTracksFromYoutubeRequest,
  User,
} from '@rpg-maestro/rpg-maestro-api-contract';
import { authenticatedFetch } from '../utils/authenticated-fetch';
import { rpgMaestroApiUrl } from '../utils/api-config';

export const getAllTracks = async (sessionId: string): Promise<Track[]> => {
  try {
    const response = await authenticatedFetch(rpgMaestroApiUrl + `/maestro/sessions/${sessionId}/tracks`, {
      credentials: 'include',
    });
    return response as Track[];
  } catch (error) {
    console.error(error);
    displayError(`Fetch /maestro/sessions/${sessionId}/tracks error: ${error}`);
    return [];
  }
};

export const getAllTrackCollections = async (): Promise<TrackCollection[]> => {
  try {
    const response = await authenticatedFetch(`${rpgMaestroApiUrl}/track-collections`, {
      credentials: 'include',
    });
    return response as TrackCollection[];
  } catch (error) {
    console.error(error);
    displayError(`Fetch /track-collections error: ${error}`);
    return [];
  }
};

export type AbortedRequestError = 'AbortedRequestError';
interface OngoingSetTrackToPlayRequest {
  abortController: AbortController;
  startTimeMs: number;
}
let ongoingSetTrackToPlayRequest: OngoingSetTrackToPlayRequest | null = null;
export const setTrackToPlay = async (
  sessionId: string,
  changeSessionPlayingTracksRequest: ChangeSessionPlayingTracksRequest
): Promise<SessionPlayingTracks | AbortedRequestError> => {
  // Abort previous request if any
  if (ongoingSetTrackToPlayRequest) {
    ongoingSetTrackToPlayRequest.abortController.abort();
  }
  ongoingSetTrackToPlayRequest = {
    abortController: new AbortController(),
    startTimeMs: Date.now(),
  };
  try {
    const response = await authenticatedFetch(`${rpgMaestroApiUrl}/maestro/sessions/${sessionId}/playing-tracks`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(changeSessionPlayingTracksRequest),
      credentials: 'include',
      signal: ongoingSetTrackToPlayRequest.abortController.signal,
    });
    const rawSerialized = response as SessionPlayingTracks;
    ongoingSetTrackToPlayRequest = null;

    return {
      sessionId: rawSerialized.sessionId,
      currentTrack: !rawSerialized.currentTrack
        ? null
        : new PlayingTrack(
            rawSerialized.currentTrack.id,
            rawSerialized.currentTrack.name,
            rawSerialized.currentTrack.url,
            rawSerialized.currentTrack.duration,
            rawSerialized.currentTrack.isPaused,
            rawSerialized.currentTrack.playTimestamp,
            rawSerialized.currentTrack.trackStartTime
          ),
    };
  } catch (error) {
    if ((error as DOMException).name === 'AbortError') {
      console.info('Previous fetchMyUser request aborted');
      return 'AbortedRequestError';
    } else {
      console.error(error);
      ongoingSetTrackToPlayRequest = null;
      return Promise.reject();
    }
  }
};

export const createTrack = async (sessionId: string, trackCreation: TrackCreation): Promise<Track> => {
  try {
    const response = await authenticatedFetch(`${rpgMaestroApiUrl}/maestro/sessions/${sessionId}/tracks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(trackCreation),
      credentials: 'include',
    });
    return response as Track;
  } catch (error) {
    console.error(error);
    return Promise.reject();
  }
};

export const createTrackFromYoutube = async (sessionId: string, url: string): Promise<void> => {
  try {
    const request: UploadAndCreateTracksFromYoutubeRequest = { urls: [url] };
    await authenticatedFetch(`${rpgMaestroApiUrl}/maestro/sessions/${sessionId}/tracks/from-youtube`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(request),
      credentials: 'include',
      signal: AbortSignal.timeout(60 * 60 * 1000),
    });
    return;
  } catch (error) {
    console.error(error);
    return Promise.reject();
  }
};

export const getTrackCreationFromYoutube = async (sessionId: string): Promise<TrackCreationFromYoutubeDto[]> => {
  try {
    const response = await authenticatedFetch(`${rpgMaestroApiUrl}/maestro/sessions/${sessionId}/tracks/from-youtube`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      credentials: 'include',
    });
    const rawDatas = response as TrackCreationFromYoutubeDto[];
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
    return Promise.reject();
  }
};

export const updateTrack = async (sessionId: string, trackId: string, trackUpdate: TrackUpdate): Promise<Track> => {
  try {
    const response = await authenticatedFetch(`${rpgMaestroApiUrl}/maestro/sessions/${sessionId}/tracks/${trackId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(trackUpdate),
      credentials: 'include',
    });
    return response as Track;
  } catch (error) {
    console.error(error);
    return Promise.reject();
  }
};

export type UserAlreadyExistsError = 'UserAlreadyExistsError';
export const onboard = async (): Promise<SessionPlayingTracks | UserAlreadyExistsError> => {
  try {
    const response = await authenticatedFetch(`${rpgMaestroApiUrl}/maestro/onboard`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      credentials: 'include',
    });
    return (await response) as SessionPlayingTracks;
  } catch (error) {
    console.error(error);
    displayError(`Fetch error: ${JSON.stringify(error)}`);
    return Promise.reject();
  }
};

export const getMaestroInfos = async (): Promise<User> => {
  try {
    const response = await authenticatedFetch(`${rpgMaestroApiUrl}/maestro`, {
      credentials: 'include',
    });
    return response as User;
  } catch (error) {
    console.error(error);
    return Promise.reject();
  }
};

export const getUserFromAPI = async (): Promise<User> => {
  try {
    const response = await authenticatedFetch(`${rpgMaestroApiUrl}/users/me`, {});
    return response as User;
  } catch (error) {
    console.error(error);
    return Promise.reject();
  }
};
