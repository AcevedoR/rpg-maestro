import { TracksDatabase } from './maestro-api/TracksDatabase';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { FirestoreTracksDatabase } from './infrastructure/persistence/firestore/FirestoreTracksDatabase';
import { InMemoryTracksDatabase } from './infrastructure/persistence/in-memory/InMemoryTracksDatabase';
import { UsersDatabase } from './maestro-api/UsersDatabase';
import { InMemoryUsersDatabase } from './infrastructure/persistence/in-memory/InMemoryUsersDatabase';

@Injectable()
export class DatabaseWrapperConfiguration {
  private readonly tracksDBImpl: TracksDatabase;
  private readonly usersDBImpl: UsersDatabase;

  constructor(@Inject('DatabaseWrapperConfiguration_DEFAULT_DATABASE_IMPL') private readonly databaseImplParam: string) {
    const databaseImpl: string | undefined = databaseImplParam;
    if (databaseImpl === 'firestore') {
      Logger.log('using firestore as database');
      this.tracksDBImpl = new FirestoreTracksDatabase();
      this.usersDBImpl = new InMemoryUsersDatabase();
    } else if (databaseImpl === 'in-memory' || !databaseImpl) {
      Logger.log('using in-memory database');
      this.tracksDBImpl = new InMemoryTracksDatabase();
      this.usersDBImpl = new InMemoryUsersDatabase();
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
}
