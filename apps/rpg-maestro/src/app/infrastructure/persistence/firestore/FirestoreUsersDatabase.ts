import { User, UserID } from '@rpg-maestro/rpg-maestro-api-contract';
import { firestore } from 'firebase-admin';
import { FirestoreAuth } from './FirestoreAuth';
import { UsersDatabase } from '../../../user-management/users-database';
import Firestore = firestore.Firestore;

const USERS_DATABASE = 'rpg-maestro-users';

export class FirestoreUsersDatabase implements UsersDatabase {
  db: Firestore;

  constructor() {
    this.db = FirestoreAuth.getFirestoreInstance();
  }

  async save(user: User): Promise<void> {
    return this.db
      .collection(USERS_DATABASE)
      .doc(user.id)
      .set(user)
      .then(() => Promise.resolve());
  }

  async get(userId: UserID): Promise<User | null> {
    const doc = await this.db.collection(USERS_DATABASE).doc(userId).get();
    if (doc.exists) {
      return doc.data() as User;
    } else {
      return Promise.resolve(null);
    }
  }
}
