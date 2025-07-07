import { TrackCollection } from '@rpg-maestro/rpg-maestro-api-contract';
import { firestore } from 'firebase-admin';
import { FirestoreAuth } from './FirestoreAuth';
import { TrackCollectionsDatabase } from '../../../track-collection/track-collections-database';
import Firestore = firestore.Firestore;

const TRACK_COLLECTIONS_DATABASE = 'rpg-maestro-track-collections';

export class FirestoreTrackCollectionsDatabase implements TrackCollectionsDatabase {
  db: Firestore;

  constructor() {
    this.db = FirestoreAuth.getFirestoreInstance();
  }

  async upsert(trackCollection: TrackCollection): Promise<TrackCollection> {
    return this.db
      .collection(TRACK_COLLECTIONS_DATABASE)
      .doc(trackCollection.id)
      .set(trackCollection)
      .then(() => Promise.resolve(trackCollection));
  }

  async get(trackCollectionId: string): Promise<TrackCollection | null> {
    const doc = await this.db.collection(TRACK_COLLECTIONS_DATABASE).doc(trackCollectionId).get();
    if (doc.exists) {
      return doc.data() as TrackCollection;
    } else {
      return Promise.resolve(null);
    }
  }

  async getAll(): Promise<TrackCollection[]> {
    return (await this.db.collection(TRACK_COLLECTIONS_DATABASE).get()).docs.map(
      (doc) => doc.data() as TrackCollection
    );
  }

  async delete(trackCollectionId: string): Promise<void> {
    await this.db.collection(TRACK_COLLECTIONS_DATABASE).doc(trackCollectionId).delete();
  }
}
