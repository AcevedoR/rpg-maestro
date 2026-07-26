import { TracksDatabase } from './maestro-api/TracksDatabase';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { FirestoreTracksDatabase } from './infrastructure/persistence/firestore/FirestoreTracksDatabase';
import { InMemoryTracksDatabase } from './infrastructure/persistence/in-memory/InMemoryTracksDatabase';
import { UsersDatabase } from './users-management/users-database';
import { InMemoryUsersDatabase } from './infrastructure/persistence/in-memory/InMemoryUsersDatabase';
import { InMemoryTrackCollectionDatabase } from './infrastructure/persistence/in-memory/InMemoryTrackCollectionDatabase';
import { TrackCollectionsDatabase } from './track-collection/track-collections-database';
import { FirestoreTrackCollectionsDatabase } from './infrastructure/persistence/firestore/FirestoreTrackCollectionsDatabase';
import { FirestoreUsersDatabase } from './infrastructure/persistence/firestore/FirestoreUsersDatabase';
import { BetaSignupsDatabase } from './landing/beta-signups-database';
import { LandingVisitsDatabase } from './landing/landing-visits-database';
import { InMemoryBetaSignupsDatabase } from './infrastructure/persistence/in-memory/InMemoryBetaSignupsDatabase';
import { InMemoryLandingVisitsDatabase } from './infrastructure/persistence/in-memory/InMemoryLandingVisitsDatabase';
import { FirestoreBetaSignupsDatabase } from './infrastructure/persistence/firestore/FirestoreBetaSignupsDatabase';
import { FirestoreLandingVisitsDatabase } from './infrastructure/persistence/firestore/FirestoreLandingVisitsDatabase';

@Injectable()
export class DatabaseWrapperConfiguration {
  private readonly tracksDBImpl: TracksDatabase;
  private readonly usersDBImpl: UsersDatabase;
  private readonly trackCollectionDBImpl: TrackCollectionsDatabase;
  private readonly betaSignupsDBImpl: BetaSignupsDatabase;
  private readonly landingVisitsDBImpl: LandingVisitsDatabase;

  constructor(
    @Inject('DatabaseWrapperConfiguration_DEFAULT_DATABASE_IMPL') private readonly databaseImplParam: string
  ) {
    const databaseImpl: string | undefined = databaseImplParam;
    if (databaseImpl === 'firestore') {
      Logger.log('using firestore as database');
      this.tracksDBImpl = new FirestoreTracksDatabase();
      this.usersDBImpl = new FirestoreUsersDatabase();
      this.trackCollectionDBImpl = new FirestoreTrackCollectionsDatabase();
      this.betaSignupsDBImpl = new FirestoreBetaSignupsDatabase();
      this.landingVisitsDBImpl = new FirestoreLandingVisitsDatabase();
    } else if (databaseImpl === 'in-memory' || !databaseImpl) {
      Logger.log('using in-memory database');
      this.tracksDBImpl = new InMemoryTracksDatabase();
      this.usersDBImpl = new InMemoryUsersDatabase();
      this.trackCollectionDBImpl = new InMemoryTrackCollectionDatabase();
      this.betaSignupsDBImpl = new InMemoryBetaSignupsDatabase();
      this.landingVisitsDBImpl = new InMemoryLandingVisitsDatabase();
    } else {
      throw new Error(`database wanted implementation: "${process.env.DATABASE}" is not handled`);
    }
  }

  public getTracksDB(): TracksDatabase {
    return this.tracksDBImpl;
  }

  public getUsersDB(): UsersDatabase {
    return this.usersDBImpl;
  }

  public getTrackCollectionDB(): TrackCollectionsDatabase {
    return this.trackCollectionDBImpl;
  }

  public getBetaSignupsDB(): BetaSignupsDatabase {
    return this.betaSignupsDBImpl;
  }

  public getLandingVisitsDB(): LandingVisitsDatabase {
    return this.landingVisitsDBImpl;
  }
}
