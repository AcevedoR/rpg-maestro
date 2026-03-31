import { TracksDatabase } from './TracksDatabase';
import {
  ChangeSessionPlayingTracksRequest,
  PlayingTrack,
  SessionPlayingTracks,
} from '@rpg-maestro/rpg-maestro-api-contract';
import { SessionsService } from '../sessions/sessions.service';

export class ManageCurrentlyPlayingTracks {
  database: TracksDatabase;
  sessionsService: SessionsService;

  constructor(database: TracksDatabase, sessionsService: SessionsService) {
    this.database = database;
    this.sessionsService = sessionsService;
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

    if (changeSessionPlayingTracksRequest.shortEffectTrack) {
      const track = await this.database.getTrack(changeSessionPlayingTracksRequest.shortEffectTrack.trackId);
      const playingTrack = new PlayingTrack(
        track.id,
        track.name,
        track.url,
        track.duration,
        false,
        Date.now(),
        0
      );
      return this.sessionsService.upsertShortEffectTrack(sessionId, playingTrack);
    }

    if (!changeSessionPlayingTracksRequest.currentTrack) {
      throw new Error('when changeSessionPlayingTracks, either currentTrack or shortEffectTrack is required');
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
    return this.sessionsService.upsertCurrentTrack(sessionId, playingTrack);
  }
}
