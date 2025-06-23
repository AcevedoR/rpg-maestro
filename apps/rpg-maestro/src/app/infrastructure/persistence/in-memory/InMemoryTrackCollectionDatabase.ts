import { TrackCollection } from '@rpg-maestro/rpg-maestro-api-contract';
import { Injectable } from '@nestjs/common';
import { TrackCollectionDatabase } from '../../../track-collection/track-collection-database';

// FIXME create firestore equivalent
@Injectable()
export class InMemoryTrackCollectionDatabase implements TrackCollectionDatabase {
  private collections: Map<string, TrackCollection> = new Map();

  async upsert(collection: TrackCollection): Promise<TrackCollection> {
    this.collections.set(collection.id, collection);
    return Promise.resolve(collection);
  }

  async get(id: string): Promise<TrackCollection | null> {
    const collection = this.collections.get(id);
    return collection ? { ...collection } : null;
  }

  async getAll(): Promise<TrackCollection[]> {
    return Array.from(this.collections.values()).map((c) => ({ ...c }));
  }

  async delete(id: string): Promise<void> {
    this.collections.delete(id);
  }
}
