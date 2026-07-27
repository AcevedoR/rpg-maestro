import { LandingEventsDailyCount, LandingEventType } from '@rpg-maestro/rpg-maestro-api-contract';
import { firestore } from 'firebase-admin';
import { FirestoreAuth } from './FirestoreAuth';
import { LandingEventsDatabase } from '../../../landing/landing-events-database';
import Firestore = firestore.Firestore;
import FieldValue = firestore.FieldValue;

const LANDING_EVENTS_DATABASE = 'rpg-maestro-landing-events';

export class FirestoreLandingEventsDatabase implements LandingEventsDatabase {
  db: Firestore;

  constructor() {
    this.db = FirestoreAuth.getFirestoreInstance();
  }

  async incrementDailyCount(date: string, type: LandingEventType, source: string): Promise<void> {
    await this.db
      .collection(LANDING_EVENTS_DATABASE)
      .doc(`${date}_${type}_${source}`)
      .set({ date, type, source, count: FieldValue.increment(1) }, { merge: true });
  }

  async getAll(): Promise<LandingEventsDailyCount[]> {
    return (await this.db.collection(LANDING_EVENTS_DATABASE).get()).docs.map(
      (doc) => doc.data() as LandingEventsDailyCount
    );
  }
}
