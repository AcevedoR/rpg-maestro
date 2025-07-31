import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { DatabaseWrapperConfiguration } from '../DatabaseWrapperConfiguration';
import { PlayingTrack, SessionPlayingTracks } from '@rpg-maestro/rpg-maestro-api-contract';
import { TracksDatabase } from '../maestro-api/TracksDatabase';
import { SessionsCache } from './sessions.cache';

@Injectable()
export class SessionsService {
  private tracksDatabase: TracksDatabase;
  private cache = new SessionsCache();

  constructor(@Inject(DatabaseWrapperConfiguration) databaseWrapper: DatabaseWrapperConfiguration) {
    this.tracksDatabase = databaseWrapper.getTracksDB();
  }

  async getSessionPlayingTracks(sessionId: string): Promise<SessionPlayingTracks | null> {
    return this.get(sessionId);
  }

  async get(sessionId: string): Promise<SessionPlayingTracks | null> {
    // TODO fix this hack forbidding having more than one instance
    // this was done to avoid reaching Firestore quotas
    const cachedSession = await this.cache.get(sessionId);
    if (cachedSession) {
      return cachedSession;
    }
    const sessionFromDB = await this.tracksDatabase.getSession(sessionId);
    if (sessionFromDB != null) {
      await this.cache.set(sessionFromDB);
    }
    return sessionFromDB;
  }

  async create(sessionId: string): Promise<void> {
    await this.tracksDatabase.createSession(sessionId);
    const session = await this.tracksDatabase.getSession(sessionId);
    if (!session) {
      throw new InternalServerErrorException('Session was not found just after creation, this should never happen');
    }
    await this.cache.set(session);
  }

  async upsertCurrentTrack(sessionId: string, playingTrack: PlayingTrack): Promise<SessionPlayingTracks> {
    const updatedSession = await this.tracksDatabase.upsertCurrentTrack(sessionId, playingTrack);
    await this.cache.set(updatedSession);
    return updatedSession;
  }

  // only for admin
  async getAll(): Promise<SessionPlayingTracks[]> {
    return this.tracksDatabase.getAllSessions();
  }
}
