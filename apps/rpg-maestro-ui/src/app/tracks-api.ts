import { displayError } from './error-utils';
import { PlayingTrack, SessionPlayingTracks } from '@rpg-maestro/rpg-maestro-api-contract';
import { AbortedRequestError } from './maestro-ui/maestro-api';

const rpgmaestroapiurl = import.meta.env.VITE_RPG_MAESTRO_API_URL;
console.info('using api: ' + rpgmaestroapiurl);

interface OngoingRequest {
  abortController: AbortController;
  startTimeMs: number;
}

let ongoingRequest: OngoingRequest | null = null;
export const getCurrentTrack = async (sessionId: string, options?: {manuallyRequested?: boolean}): Promise<PlayingTrack | null | AbortedRequestError> => {
  // Abort previous request if any
  if (ongoingRequest) {
    if(options?.manuallyRequested){
      ongoingRequest.abortController.abort();
    } else {
      const ongoingRequestDuration = Date.now() - ongoingRequest.startTimeMs;
      if (ongoingRequestDuration < 10000) {
        return Promise.resolve('AbortedRequestError');
      }
    }
  }
  ongoingRequest = {
    abortController: new AbortController(),
    startTimeMs: Date.now(),
  };
  try {
    const response = await fetch(`${rpgmaestroapiurl}/sessions/${sessionId}/playing-tracks`, {
      signal: ongoingRequest.abortController.signal,
    });
    if (response.ok) {
      const res = (await response.json()) as SessionPlayingTracks;
      const track = res.currentTrack;
      ongoingRequest = null;
      if (track != null) {
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
    if ((error as DOMException).name === 'AbortError') {
      ongoingRequest = null;
      return 'AbortedRequestError';
    }
    console.error(error);
    displayError(`Fetch current/tracks error: ${error}`);
    return null;
  }
};
