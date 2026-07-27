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
      shortEffectTrack: null,
      revision: 0,
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
    const existing = await this.getSession(sessionId);
    const revision = (existing?.revision ?? 0) + 1;
    const sessionEntity: SessionPlayingTrackEntity = {
      id: sessionId,
      currentTrack: playingTrackToEntity(playingTrack, revision),
      // Untouched slot keeps its own revision, so a music change does not make a live effect look new.
      shortEffectTrack: existing?.shortEffectTrack ? playingTrackToEntity(existing.shortEffectTrack) : null,
      revision,
    };
    await this.db
      .collection(RPG_MAESTRO_SESSIONS_DB)
      .doc(sessionId)
      .set(sessionEntity);
    return entityToSession(sessionEntity);
  }

  async upsertShortEffectTrack(sessionId: string, playingTrack: PlayingTrack): Promise<SessionPlayingTracks> {
    const existing = await this.getSession(sessionId);
    const revision = (existing?.revision ?? 0) + 1;
    const sessionEntity: SessionPlayingTrackEntity = {
      id: sessionId,
      currentTrack: existing?.currentTrack ? playingTrackToEntity(existing.currentTrack) : null,
      shortEffectTrack: playingTrackToEntity(playingTrack, revision),
      revision,
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
  shortEffectTrack: PlayingTrackEntity | null;
  /** Optional on read only: documents written before revisions existed do not carry it. */
  revision?: number;
}

interface PlayingTrackEntity {
  id: string;
  name: string;
  url: string;
  duration: number;

  isPaused: boolean;
  playTimestamp: number;
  trackStartTime: number;
  revision?: number;
}

/**
 * `revision` is passed in rather than read off the track, because the caller builds the PlayingTrack before
 * the store has decided which revision the write gets. Omit it to carry over whatever the track already had
 * (used when rewriting the slot this write did not touch).
 */
function playingTrackToEntity(track: PlayingTrack, revision?: number): PlayingTrackEntity {
  return {
    id: track.id,
    name: track.name,
    url: track.url,
    duration: track.duration,
    isPaused: track.isPaused,
    playTimestamp: track.playTimestamp,
    trackStartTime: track.trackStartTime,
    revision: revision ?? track.revision ?? 0,
  };
}

function entityToPlayingTrack(entity: PlayingTrackEntity): PlayingTrack {
  return new PlayingTrack(
    entity.id,
    entity.name,
    entity.url,
    entity.duration,
    entity.isPaused,
    entity.playTimestamp,
    entity.trackStartTime,
    // Pre-revision documents read back as 0. The first write after this deploy bumps the session to 1, which
    // every client sees as a change and resyncs once — a single harmless reseek, not a stuck state.
    entity.revision ?? 0
  );
}

function entityToSession(entity: SessionPlayingTrackEntity): SessionPlayingTracks {
  return {
    sessionId: entity.id,
    currentTrack: entity.currentTrack ? entityToPlayingTrack(entity.currentTrack) : null,
    shortEffectTrack: entity.shortEffectTrack ? entityToPlayingTrack(entity.shortEffectTrack) : null,
    revision: entity.revision ?? 0,
  };
}
