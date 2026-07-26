import { LandingVisitsDailyCount } from '@rpg-maestro/rpg-maestro-api-contract';
import { firestore } from 'firebase-admin';
import { FirestoreAuth } from './FirestoreAuth';
import { LandingVisitsDatabase } from '../../../landing/landing-visits-database';
import Firestore = firestore.Firestore;
import FieldValue = firestore.FieldValue;

const LANDING_VISITS_DATABASE = 'rpg-maestro-landing-visits';

export class FirestoreLandingVisitsDatabase implements LandingVisitsDatabase {
  db: Firestore;

  constructor() {
    this.db = FirestoreAuth.getFirestoreInstance();
  }

  async incrementDailyCount(date: string, source: string): Promise<void> {
    await this.db
      .collection(LANDING_VISITS_DATABASE)
      .doc(`${date}_${source}`)
      .set({ date, source, count: FieldValue.increment(1) }, { merge: true });
  }

  async getAll(): Promise<LandingVisitsDailyCount[]> {
    return (await this.db.collection(LANDING_VISITS_DATABASE).get()).docs.map(
      (doc) => doc.data() as LandingVisitsDailyCount
    );
  }
}
