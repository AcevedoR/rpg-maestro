import { ForbiddenException, HttpException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { TrackCollection, TrackCollectionCreation, TrackCollectionUpdate } from '@rpg-maestro/rpg-maestro-api-contract';
import { DatabaseWrapperConfiguration } from '../DatabaseWrapperConfiguration';
import { getTrackFileMetadata } from '../maestro-api/TrackService';
import { TrackCollectionDatabase } from './track-collection-database';

@Injectable()
export class TrackCollectionService {
  trackCollectionDatabase: TrackCollectionDatabase;

  constructor(@Inject(DatabaseWrapperConfiguration) databaseWrapper: DatabaseWrapperConfiguration) {
    this.trackCollectionDatabase = databaseWrapper.getTrackCollectionDB();
  }

  async create(creation: TrackCollectionCreation, userId: string): Promise<TrackCollection> {
    // todo make if failsafe
    if ((await this.trackCollectionDatabase.get(creation.id)) !== null) {
      throw new HttpException(`Cannot create Track collection, a collection with id: ${creation.id} already exists`, 409);
    }
    for (const track of creation.tracks) {
      await getTrackFileMetadata(track.url);
    }
    const collection = await this.trackCollectionDatabase.upsert(creation, userId);
    return collection;
  }

  async get(id: string): Promise<TrackCollection> {
    const collection = await this.trackCollectionDatabase.get(id);
    if (!collection) {
      throw new NotFoundException(`TrackCollection with id ${id} not found`);
    }
    return collection;
  }

  async getAll(): Promise<TrackCollection[]> {
    return await this.trackCollectionDatabase.getAll();
  }

  async update(id: string, update: TrackCollectionUpdate, userId: string): Promise<TrackCollection> {
    const existing = await this.get(id);

    return;
  }

  async delete(id: string, userId: string): Promise<void> {
    const existing = await this.get(id);

    // Only the creator can delete the collection
    if (existing.created_by !== userId) {
      throw new ForbiddenException('Only the creator can delete this collection');
    }

    await this.trackCollectionDatabase.delete(id);
  }
}
