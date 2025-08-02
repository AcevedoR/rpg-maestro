import { PlayingTrack, SessionID, SessionPlayingTracks, Track } from '@rpg-maestro/rpg-maestro-api-contract';
import { TracksDatabase } from '../../../maestro-api/TracksDatabase';
import { firestore } from 'firebase-admin';
import { FirestoreAuth } from './FirestoreAuth';
import Firestore = firestore.Firestore;
import Filter = firestore.Filter;

const RPG_MAESTRO_SESSIONS_DB = 'rpg-maestro-sessions';

const RPG_MAESTRO_TRACKS_DB = 'rpg-maestro-tracks';

export class FirestoreTracksDatabase implements TracksDatabase {
  db: Firestore;

  constructor() {
    this.db = FirestoreAuth.getFirestoreInstance();
  }

  async createSession(sessionId: SessionID): Promise<void> {
    const newSession: SessionPlayingTrackEntity = {
      id: sessionId,
      currentTrack: null,
    };
    await this.db.collection(RPG_MAESTRO_SESSIONS_DB).doc(sessionId).set(newSession);
    return await Promise.resolve();
  }

  async getSession(sessionId: string): Promise<SessionPlayingTracks | null> {
    const sessionDoc = await this.db.collection(RPG_MAESTRO_SESSIONS_DB).doc(sessionId).get();
    if (sessionDoc.exists) {
      const data = sessionDoc.data() as SessionPlayingTrackEntity;
      return entityToSession(data);
    } else {
      return Promise.resolve(null);
    }
  }

  async getAllSessions(): Promise<SessionPlayingTracks[]> {
    return (
      await this.db.collection(RPG_MAESTRO_SESSIONS_DB).get()
    ).docs.map((doc) => entityToSession(doc.data() as SessionPlayingTrackEntity));
  }

  async save(track: Track): Promise<void> {
    return this.db
      .collection(RPG_MAESTRO_TRACKS_DB)
      .doc(track.id)
      .set(track)
      .then(() => Promise.resolve());
  }

  async upsertCurrentTrack(sessionId: string, playingTrack: PlayingTrack): Promise<SessionPlayingTracks> {
    const sessionEntity: SessionPlayingTrackEntity = {
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
    await this.db
      .collection(RPG_MAESTRO_SESSIONS_DB)
      .doc(sessionId)
      .set(sessionEntity);
    return entityToSession(sessionEntity);
  }

  async getTrack(trackId: string): Promise<Track> {
    const doc = await this.db.collection(RPG_MAESTRO_TRACKS_DB).doc(trackId).get();
    if (doc.exists) {
      return doc.data() as Track;
    } else {
      throw new Error('track not found for id: ' + trackId);
    }
  }

  async getAllTracks(sessionId: string): Promise<Track[]> {
    return (
      await this.db.collection(RPG_MAESTRO_TRACKS_DB).where(Filter.where('sessionId', '==', sessionId)).get()
    ).docs.map((doc) => doc.data() as Track);
  }
}

interface SessionPlayingTrackEntity {
  id: string;
  currentTrack: PlayingTrackEntity | null;
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

function entityToSession(entity: SessionPlayingTrackEntity): SessionPlayingTracks{
  const session: SessionPlayingTracks = {
    sessionId: entity.id,
    currentTrack: entity.currentTrack ? new PlayingTrack(
      entity.currentTrack.id,
      entity.currentTrack.name,
      entity.currentTrack.url,
      entity.currentTrack.duration,
      entity.currentTrack.isPaused,
      entity.currentTrack.playTimestamp,
      entity.currentTrack.trackStartTime
    ) : null,
  }
  return session;
}
