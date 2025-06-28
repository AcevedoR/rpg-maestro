import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { UsersDatabase } from '../user-management/users-database';
import { TracksDatabase } from './TracksDatabase';
import { SessionAccess, SessionID, SessionPlayingTracks, User, UserID } from '@rpg-maestro/rpg-maestro-api-contract';
import { DatabaseWrapperConfiguration } from '../DatabaseWrapperConfiguration';

@Injectable()
export class OnboardingService {
  usersDatabase: UsersDatabase;
  tracksDatabase: TracksDatabase;

  constructor(
    @Inject(DatabaseWrapperConfiguration) databaseWrapper: DatabaseWrapperConfiguration
  ) {
    this.usersDatabase = databaseWrapper.getUsersDB();
    this.tracksDatabase = databaseWrapper.getTracksDB();
  }

  async createNewUserWithSession(userId: UserID): Promise<SessionPlayingTracks> {
    const alreadyExistingUser = await this.usersDatabase.get(userId);
    if (alreadyExistingUser) {
      throw new HttpException(`User ${userId} already exists`, HttpStatus.CONFLICT);
    }

    const user: User = {
      id: userId,
      created_at: Date.now(),
      updated_at: Date.now(),
      role: 'MINSTREL',
    };
    await this.usersDatabase.save(user);

    return this.createSessionInternal(user);
  }

  async createSession(userId: UserID): Promise<SessionPlayingTracks> {
    const user = await this.usersDatabase.get(userId);
    if (!user) {
      throw new HttpException(`User ${userId} does not exists`, HttpStatus.UNPROCESSABLE_ENTITY);
    }
    return this.createSessionInternal(user);
  }

  private async createSessionInternal(user: User): Promise<SessionPlayingTracks> {
    const sessionId = await this.generateSessionId();
    await this.tracksDatabase.createSession(sessionId);
    await this.giveUserAccessToSession(user, sessionId);
    return await this.tracksDatabase.getSession(sessionId);
  }

  private async giveUserAccessToSession(user: User, sessionId: SessionID): Promise<void> {
    const newSessionAccess: SessionAccess = {
      created_at: Date.now(),
      updated_at: Date.now(),
      access: 'OWNER',
    };
    if (!user.sessions) {
      user.sessions = {};
    }
    user.sessions[sessionId] = newSessionAccess;
    await this.usersDatabase.save(user);
  }

  private async generateSessionId(): Promise<string> {
    const id = [...Array(7)]
      .map(() => {
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        return chars.charAt(Math.floor(Math.random() * chars.length));
      })
      .join('');
    if (await this.tracksDatabase.getSession(id) !== null) {
      throw new Error(`session ${id} already exists`);
    }
    return id;
  }
}
