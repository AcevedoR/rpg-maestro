import { UpgradeInterest } from '@rpg-maestro/rpg-maestro-api-contract';
import { firestore } from 'firebase-admin';
import { FirestoreAuth } from './FirestoreAuth';
import { UpgradeInterestDatabase } from '../../../landing/upgrade-interest-database';
import Firestore = firestore.Firestore;

const UPGRADE_INTEREST_DATABASE = 'rpg-maestro-upgrade-interest';

export class FirestoreUpgradeInterestDatabase implements UpgradeInterestDatabase {
  db: Firestore;

  constructor() {
    this.db = FirestoreAuth.getFirestoreInstance();
  }

  async upsert(upgradeInterest: UpgradeInterest): Promise<UpgradeInterest> {
    const document: UpgradeInterest = {
      email: upgradeInterest.email,
      created_at: upgradeInterest.created_at,
      had_session: upgradeInterest.had_session,
    };
    if (upgradeInterest.source !== undefined) {
      document.source = upgradeInterest.source;
    }
    if (upgradeInterest.referrer !== undefined) {
      document.referrer = upgradeInterest.referrer;
    }
    return this.db
      .collection(UPGRADE_INTEREST_DATABASE)
      .doc(upgradeInterest.email)
      .set(document)
      .then(() => Promise.resolve(upgradeInterest));
  }

  async get(email: string): Promise<UpgradeInterest | null> {
    const doc = await this.db.collection(UPGRADE_INTEREST_DATABASE).doc(email).get();
    if (doc.exists) {
      return doc.data() as UpgradeInterest;
    } else {
      return Promise.resolve(null);
    }
  }

  async getAll(): Promise<UpgradeInterest[]> {
    return (await this.db.collection(UPGRADE_INTEREST_DATABASE).get()).docs.map((doc) => doc.data() as UpgradeInterest);
  }
}
