import { Injectable } from '@nestjs/common';
import { SessionPlayingTracks, Track } from '@rpg-maestro/rpg-maestro-api-contract';
import { DatabaseWrapperConfiguration } from '../DatabaseWrapperConfiguration';

@Injectable()
export class PlayersService {
  constructor(private databaseWrapper: DatabaseWrapperConfiguration) {}

  async getTrack(id: string): Promise<Track> {
    return this.databaseWrapper.getTracksDB().getTrack(id);
  }

  async getSessionPlayingTracks(sessionId: string): Promise<SessionPlayingTracks|null> {
    return this.databaseWrapper.getTracksDB().getSession(sessionId);
  }
}
