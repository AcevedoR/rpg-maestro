import { Database } from './maestro-api/Database';
import { Injectable, Logger } from '@nestjs/common';
import { FirestoreDatabase } from './infrastructure/FirestoreDatabase';
import { InMemoryDatabase } from './infrastructure/InMemoryDatabase';

@Injectable()
export class DatabaseWrapperConfiguration {
  private databaseImplementation: Database;

  constructor() {
    const databaseImpl: string | undefined = process.env.DATABASE;
    if (databaseImpl === 'firestore') {
      Logger.log('using firestore as database');
      this.databaseImplementation = new FirestoreDatabase();
    } else if (databaseImpl === 'in-memory' || !databaseImpl) {
      Logger.log('using in-memory database');
      this.databaseImplementation = new InMemoryDatabase();
    } else {
      throw new Error(`database wanted implementation: "${process.env.DATABASE}" is not handled`);
    }
  }

  get() {
    return this.databaseImplementation;
  }
}
