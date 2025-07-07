import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { TracksDatabase } from './TracksDatabase';
import {
  CreateSession,
  parseAndValidateDto,
  SessionAccess,
  SessionID,
  SessionPlayingTracks,
  Track,
  User,
  UserID,
} from '@rpg-maestro/rpg-maestro-api-contract';
import { DatabaseWrapperConfiguration } from '../DatabaseWrapperConfiguration';
import { TrackService } from './TrackService';
import { TrackCollectionService } from '../track-collection/track-collection.service';
import { ManageCurrentlyPlayingTracks } from './ManageCurrentlyPlayingTracks';
import { UsersService } from '../users-management/users.service';

@Injectable()
export class OnboardingService {
  private tracksDatabase: TracksDatabase;
  private manageCurrentlyPlayingTracks: ManageCurrentlyPlayingTracks;

  constructor(
    @Inject(DatabaseWrapperConfiguration) databaseWrapper: DatabaseWrapperConfiguration,
    private trackService: TrackService,
    private trackCollectionService: TrackCollectionService,
    private usersService: UsersService
  ) {
    this.tracksDatabase = databaseWrapper.getTracksDB();
    this.manageCurrentlyPlayingTracks = new ManageCurrentlyPlayingTracks(databaseWrapper.getTracksDB());
  }

  async createNewUserWithSession(userId: UserID, options?: { noCollections: boolean }): Promise<SessionPlayingTracks> {
    const alreadyExistingUser = await this.usersService.get(userId);
    if (alreadyExistingUser) {
      throw new HttpException(`User ${userId} already exists`, HttpStatus.CONFLICT);
    }

    const now = Date.now();
    const user: User = {
      id: userId,
      created_at: now,
      updated_at: now,
      role: 'MINSTREL',
    };
    await this.usersService.save(user);

    return this.createSessionInternal(
      await parseAndValidateDto(CreateSession, options?.noCollections ? {} : { withTrackCollections: ['default'] }),
      user
    );
  }

  async createSession(createSession: CreateSession, userId: UserID): Promise<SessionPlayingTracks> {
    const user = await this.usersService.get(userId);
    if (!user) {
      throw new HttpException(`User ${userId} does not exists`, HttpStatus.UNPROCESSABLE_ENTITY);
    }
    return this.createSessionInternal(createSession, user);
  }

  private async createSessionInternal(createSession: CreateSession, user: User): Promise<SessionPlayingTracks> {
    const sessionId = await this.generateSessionId();
    await this.tracksDatabase.createSession(sessionId);
    await this.giveUserAccessToSession(user, sessionId);
    if (createSession.withTrackCollections) {
      await this.importTracksFromCollections(sessionId, createSession.withTrackCollections);
    }
    return await this.tracksDatabase.getSession(sessionId);
  }

  private async importTracksFromCollections(sessionId: string, trackCollectionsIds: string[]): Promise<Track[]> {
    const importedTracks: Track[] = [];
    for (const collectionId of trackCollectionsIds) {
      const collection = await this.trackCollectionService.get(collectionId);
      importedTracks.push(...(await this.trackService.importTracksFromTrackCollection(sessionId, collection)));
    }
    await this.manageCurrentlyPlayingTracks.changeSessionPlayingTracks(sessionId, {
      currentTrack: { trackId: importedTracks[0].id },
    });
    return importedTracks;
  }

  private async giveUserAccessToSession(user: User, sessionId: SessionID): Promise<void> {
    const now = Date.now();
    const newSessionAccess: SessionAccess = {
      created_at: now,
      updated_at: now,
      access: 'OWNER',
    };
    if (!user.sessions) {
      user.sessions = {};
    }
    user.sessions[sessionId] = newSessionAccess;
    await this.usersService.save(user);
  }

  private async generateSessionId(): Promise<string> {
    const id = [...Array(7)]
      .map(() => {
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        return chars.charAt(Math.floor(Math.random() * chars.length));
      })
      .join('');
    if ((await this.tracksDatabase.getSession(id)) !== null) {
      throw new Error(`session ${id} already exists`);
    }
    return id;
  }
}
