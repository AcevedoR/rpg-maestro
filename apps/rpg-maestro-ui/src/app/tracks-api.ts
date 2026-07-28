import { displayError } from './error-utils';
import { PlayingTrack, SessionPlayingTracks } from '@rpg-maestro/rpg-maestro-api-contract';
import { AbortedRequestError, SessionNotFoundError } from './maestro-ui/maestro-api';

const rpgmaestroapiurl = import.meta.env.VITE_RPG_MAESTRO_API_URL;
console.info('using api: ' + rpgmaestroapiurl);

interface OngoingRequest {
  abortController: AbortController;
  startTimeMs: number;
}

/**
 * Rebuilds the class instances JSON cannot carry: `PlayingTrack.getCurrentPlayTime()` is behaviour,
 * and the parsed payload is only data.
 */
export function deserializeSessionPlayingTracks(raw: SessionPlayingTracks): SessionPlayingTracks {
  return {
    sessionId: raw.sessionId,
    currentTrack: raw.currentTrack ? deserializePlayingTrack(raw.currentTrack) : null,
    shortEffectTrack: raw.shortEffectTrack ? deserializePlayingTrack(raw.shortEffectTrack) : null,
  };
}

function deserializePlayingTrack(track: PlayingTrack): PlayingTrack {
  return new PlayingTrack(
    track.id,
    track.name,
    track.url,
    track.duration,
    track.isPaused,
    track.playTimestamp,
    track.trackStartTime
  );
}

let ongoingRequest: OngoingRequest | null = null;
export const getSessionPlayingTracks = async (
  sessionId: string,
  options?: { manuallyRequested?: boolean }
): Promise<SessionPlayingTracks | AbortedRequestError | SessionNotFoundError> => {
  // Abort previous request if any
  if (ongoingRequest) {
    if (options?.manuallyRequested) {
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
      ongoingRequest = null;
      return deserializeSessionPlayingTracks(res);
    } else if (response.status === 404) {
      // Expected outcome for a mistyped or stale session link, not a transport failure: report it as
      // a distinct result so the caller can stop polling, and skip the error toast that would
      // otherwise fire on every sync tick.
      ongoingRequest = null;
      return 'SessionNotFoundError';
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
    return { sessionId, currentTrack: null, shortEffectTrack: null };
  }
};
