import { TracksDatabase } from './TracksDatabase';
import {
  ChangeSessionPlayingTracksRequest,
  PlayingTrack,
  SessionPlayingTracks,
} from '@rpg-maestro/rpg-maestro-api-contract';

export class ManageCurrentlyPlayingTracks {
  database: TracksDatabase;

  constructor(database: TracksDatabase) {
    this.database = database;
  }

  async changeSessionPlayingTracks(
    sessionId: string,
    changeSessionPlayingTracksRequest: ChangeSessionPlayingTracksRequest
  ): Promise<SessionPlayingTracks> {
    if (!sessionId) {
      throw new Error('when changeSessionPlayingTracks, sessionId is required');
    }
    if (!changeSessionPlayingTracksRequest) {
      throw new Error('when changeSessionPlayingTracks, request is required');
    }

    const track = await this.database.getTrack(changeSessionPlayingTracksRequest.currentTrack.trackId);
    const playingTrack = new PlayingTrack(
      track.id,
      track.name,
      track.url,
      track.duration,
      changeSessionPlayingTracksRequest.currentTrack.paused ?? false,
      Date.now(),
      changeSessionPlayingTracksRequest.currentTrack.startTime ?? 0
    );
    await this.database.upsertCurrentTrack(sessionId, playingTrack);
    return Promise.resolve({ currentTrack: playingTrack });
  }
}
