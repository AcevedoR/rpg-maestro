import { TrackCollection } from '@rpg-maestro/rpg-maestro-api-contract';
import { Injectable } from '@nestjs/common';
import { TrackCollectionsDatabase } from '../../../track-collection/track-collections-database';

@Injectable()
export class InMemoryTrackCollectionDatabase implements TrackCollectionsDatabase {
  private collections: Map<string, TrackCollection> = new Map([
    [
      'default',
      {
        id: 'default',
        name: 'Default Collection',
        tracks: [
          {
            id: 'track-id-1',
            source: {
              origin_media: 'origin media 1',
              origin_url: 'https://cdn.freesound.org/previews/763/763587_10152894-lq.mp3',
              origin_name: 'inspiring-upbeat-corporate-250495.mp3',
            },
            duration: 121000,
            name: 'inspiring-upbeat-corporate',
            tags: ['test'],
            url: 'https://cdn.freesound.org/previews/763/763587_10152894-lq.mp3',
          },
        ],
      } as TrackCollection,
    ],
  ]);

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
