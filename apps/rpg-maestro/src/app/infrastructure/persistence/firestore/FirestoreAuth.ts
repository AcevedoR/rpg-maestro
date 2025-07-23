import { cert, initializeApp } from 'firebase-admin/app';
import { Firestore, getFirestore } from 'firebase-admin/firestore';


interface GCPServiceAccountJson {
  project_id: string | undefined;
  client_email: string | undefined;
  private_key: string | undefined;
}

export class FirestoreAuth {
  private static instance: FirestoreAuth;

  private firestoreInstance: Firestore;

  private constructor() {
    const googleApplicationCredentials: string | undefined = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (!googleApplicationCredentials) {
      throw new Error('GOOGLE_APPLICATION_CREDENTIALS env var is required when running with Firestore as database');
    }
    const serviceAccount: GCPServiceAccountJson = JSON.parse(googleApplicationCredentials) as GCPServiceAccountJson;
    if (!serviceAccount || !serviceAccount.project_id) {
      throw new Error('a valid GOOGLE_APPLICATION_CREDENTIALS env var is required when running with Firestore as database');
    }
    initializeApp({
      credential: cert({
        projectId: serviceAccount.project_id,
        privateKey: serviceAccount.private_key,
        clientEmail: serviceAccount.client_email,
      }),
    });
    this.firestoreInstance = getFirestore();
    this.firestoreInstance.settings({ ignoreUndefinedProperties: true })
  }

  public static getFirestoreInstance():Firestore {
    if(!FirestoreAuth.instance) {
      FirestoreAuth.instance = new FirestoreAuth();
    }
    return FirestoreAuth.instance.firestoreInstance;
  }
}
