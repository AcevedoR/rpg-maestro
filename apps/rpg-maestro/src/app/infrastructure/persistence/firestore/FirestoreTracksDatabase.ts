import { PlayingTrack, SessionPlayingTracks, Track } from '@rpg-maestro/rpg-maestro-api-contract';
import { TracksDatabase } from '../../../maestro-api/TracksDatabase';
import { firestore } from 'firebase-admin';
import { FirestoreAuth } from './FirestoreAuth';
import Firestore = firestore.Firestore;
import Filter = firestore.Filter;

export class FirestoreTracksDatabase implements TracksDatabase {
  db: Firestore;

  constructor() {
    this.db = FirestoreAuth.getFirestoreInstance();
  }

  async save(track: Track): Promise<void> {
    return this.db
      .collection('rpg-maestro-tracks')
      .doc(track.id)
      .set(track)
      .then(() => Promise.resolve());
  }

  async getCurrentSession(sessionId: string): Promise<SessionPlayingTracks> {
    const sessionDoc = await this.db.collection('rpg-maestro-sessions').doc(sessionId).get();
    if (sessionDoc.exists) {
      const data = sessionDoc.data() as SessionPlayingTrackEntity;
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

  async upsertCurrentTrack(sessionId: string, playingTrack: PlayingTrack): Promise<void> {
    const defaultCurrentSession: SessionPlayingTrackEntity = {
      id: sessionId,
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
      .doc(sessionId)
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

  async getAllTracks(sessionId: string): Promise<Track[]> {
    return (
      await this.db.collection('rpg-maestro-tracks').where(Filter.where('sessionId', '==', sessionId)).get()
    ).docs.map((doc) => doc.data() as Track);
  }
}

interface SessionPlayingTrackEntity {
  id: string;
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
