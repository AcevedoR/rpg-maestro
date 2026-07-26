import { BetaSignup } from '@rpg-maestro/rpg-maestro-api-contract';
import { firestore } from 'firebase-admin';
import { FirestoreAuth } from './FirestoreAuth';
import { BetaSignupsDatabase } from '../../../landing/beta-signups-database';
import Firestore = firestore.Firestore;

const BETA_SIGNUPS_DATABASE = 'rpg-maestro-beta-signups';

export class FirestoreBetaSignupsDatabase implements BetaSignupsDatabase {
  db: Firestore;

  constructor() {
    this.db = FirestoreAuth.getFirestoreInstance();
  }

  async upsert(signup: BetaSignup): Promise<BetaSignup> {
    const document: BetaSignup = { email: signup.email, created_at: signup.created_at };
    if (signup.source !== undefined) {
      document.source = signup.source;
    }
    if (signup.referrer !== undefined) {
      document.referrer = signup.referrer;
    }
    return this.db
      .collection(BETA_SIGNUPS_DATABASE)
      .doc(signup.email)
      .set(document)
      .then(() => Promise.resolve(signup));
  }

  async get(email: string): Promise<BetaSignup | null> {
    const doc = await this.db.collection(BETA_SIGNUPS_DATABASE).doc(email).get();
    if (doc.exists) {
      return doc.data() as BetaSignup;
    } else {
      return Promise.resolve(null);
    }
  }

  async getAll(): Promise<BetaSignup[]> {
    return (await this.db.collection(BETA_SIGNUPS_DATABASE).get()).docs.map((doc) => doc.data() as BetaSignup);
  }
}
