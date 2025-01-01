import { Database } from './maestro-api/Database';
import { Logger } from '@nestjs/common';
import { FirestoreDatabase } from './infrastructure/FirestoreDatabase';
import { InMemoryDatabase } from './infrastructure/InMemoryDatabase';

export function getConfiguredDatabaseImplementation() : Database{
  const databaseImpl: string | undefined = process.env.DATABASE;
  if (databaseImpl === 'firestore') {
    Logger.log('using firestore as database');
    return new FirestoreDatabase();
  } else if (databaseImpl === 'in-memory' || !databaseImpl) {
    Logger.log('using in-memory database');
    return new InMemoryDatabase();
  } else {
    throw new Error(`database wanted implementation: "${process.env.DATABASE}" is not handled`);
  }
}