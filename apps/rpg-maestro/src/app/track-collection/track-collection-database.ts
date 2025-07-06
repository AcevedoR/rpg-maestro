import { TrackCollection } from '@rpg-maestro/rpg-maestro-api-contract';

export interface TrackCollectionDatabase {
  upsert(collection: TrackCollection): Promise<TrackCollection>;
  get(id: string): Promise<TrackCollection | null>;
  getAll(): Promise<TrackCollection[]>;
  delete(id: string): Promise<void>;
}
