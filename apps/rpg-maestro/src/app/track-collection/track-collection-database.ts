import { TrackCollection, TrackCollectionCreation, TrackCollectionUpdate } from '@rpg-maestro/rpg-maestro-api-contract';

export interface TrackCollectionDatabase {
  upsert(collection: TrackCollectionCreation | TrackCollectionUpdate, created_by: string): Promise<TrackCollection>;
  get(id: string): Promise<TrackCollection | null>;
  getAll(): Promise<TrackCollection[]>;
  delete(id: string): Promise<void>;
}
