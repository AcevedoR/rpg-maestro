import { Database } from './maestro-api/Database';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { FirestoreDatabase } from './infrastructure/FirestoreDatabase';
import { InMemoryDatabase } from './infrastructure/InMemoryDatabase';
import { ModuleRef } from '@nestjs/core';

@Injectable()
export class DatabaseWrapperConfiguration implements OnModuleInit {
  private databaseImplementation: Database;

  constructor(private moduleRef: ModuleRef) {}

  async onModuleInit() {
    const databaseImpl: string | undefined = process.env.DATABASE;
    if (databaseImpl === 'firestore') {
      Logger.log('using firestore as database');
      this.databaseImplementation = await this.moduleRef.create(FirestoreDatabase);
    } else if (databaseImpl === 'in-memory' || !databaseImpl) {
      Logger.log('using in-memory database');
      this.databaseImplementation = await this.moduleRef.create(InMemoryDatabase);
    } else {
      throw new Error(`database wanted implementation: "${process.env.DATABASE}" is not handled`);
    }
  }
  get(){
    return this.databaseImplementation;
  }
}
