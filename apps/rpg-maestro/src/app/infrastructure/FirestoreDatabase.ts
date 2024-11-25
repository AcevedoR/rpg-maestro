import { PlayingTrack, Track } from '@rpg-maestro/rpg-maestro-api-contract';
import { Database } from '../admin-api/Database';
import { Session } from '../model/Session';
import { cert, initializeApp } from 'firebase-admin/app';

import { getFirestore } from 'firebase-admin/firestore';
import { firestore } from 'firebase-admin';
import Firestore = firestore.Firestore;

export const DEFAULT_CURRENT_SESSION_ID = 'default-current-session';

interface GCPServiceAccountJson {
  project_id: string | undefined;
  client_email: string | undefined;
  private_key: string | undefined;
}

export class FirestoreDatabase implements Database {
  db: Firestore;

  constructor() {
    const googleApplicationCredentials: string | undefined = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (!googleApplicationCredentials) {
      throw new Error('GOOGLE_APPLICATION_CREDENTIALS env var is required when running with Firestore as database');
    }
    const serviceAccount: GCPServiceAccountJson = JSON.parse(googleApplicationCredentials) as GCPServiceAccountJson;
    if(!serviceAccount || !serviceAccount.project_id){
      throw new Error('GOOGLE_APPLICATION_CREDENTIALS env var is required when running with Firestore as database');
    }
    initializeApp({
      credential: cert({
        projectId: serviceAccount.project_id,
        privateKey: serviceAccount.private_key,
        clientEmail: serviceAccount.client_email,
      }),
    });
    this.db = getFirestore();
  }

  async save(track: Track): Promise<void> {
    return this.db
      .collection('rpg-maestro-tracks')
      .doc(track.id)
      .set(track)
      .then(() => Promise.resolve());
  }

  async getCurrentSession(): Promise<Session> {
    const sessionDoc = await this.db.collection('rpg-maestro-sessions').doc(DEFAULT_CURRENT_SESSION_ID).get();
    if (sessionDoc.exists) {
      const data = sessionDoc.data() as SessionEntity;
      const currentTrackEntity = data.currentTrack;
      return {
        currentTrack: new PlayingTrack(
          currentTrackEntity.id,
          currentTrackEntity.name,
          currentTrackEntity.url,
          currentTrackEntity.duration,
          currentTrackEntity.isPaused,
          currentTrackEntity.playTimestamp,
          currentTrackEntity.trackStartTime
        ),
      };
    } else {
      throw new Error('default session not found');
    }
  }

  async upsertCurrentTrack(playingTrack: PlayingTrack): Promise<void> {
    const defaultCurrentSession: SessionEntity = {
      currentTrack: {
        id: playingTrack.id,
        name: playingTrack.name,
        url: playingTrack.url,
        duration: playingTrack.duration,
        isPaused: playingTrack.isPaused,
        playTimestamp: playingTrack.playTimestamp,
        trackStartTime: playingTrack.trackStartTime,
      },
    };
    return this.db
      .collection('rpg-maestro-sessions')
      .doc(DEFAULT_CURRENT_SESSION_ID)
      .set(defaultCurrentSession)
      .then(() => Promise.resolve());
  }

  async getTrack(trackId: string): Promise<Track> {
    const doc = await this.db.collection('rpg-maestro-tracks').doc(trackId).get();
    if (doc.exists) {
      return doc.data() as Track;
    } else {
      throw new Error('track not found for id: ' + trackId);
    }
  }

  async getAllTracks(): Promise<Track[]> {
    return (await this.db.collection('rpg-maestro-tracks').get()).docs.map((doc) => doc.data() as Track);
  }
}

interface SessionEntity {
  currentTrack: PlayingTrackEntity;
}

interface PlayingTrackEntity {
  id: string;
  name: string;
  url: string;
  duration: number;

  isPaused: boolean;
  playTimestamp: number;
  trackStartTime: number;
}
