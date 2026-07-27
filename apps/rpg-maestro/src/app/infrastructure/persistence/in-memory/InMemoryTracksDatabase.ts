import { TracksDatabase } from '../../../maestro-api/TracksDatabase';
import { PlayingTrack, SessionID, SessionPlayingTracks, Track } from '@rpg-maestro/rpg-maestro-api-contract';

export class InMemoryTracksDatabase implements TracksDatabase {
  tracksDatabase: Track[] = [];
  sessionDatabase: { [name: SessionID]: SessionPlayingTracks } = {};

  createSession(sessionId: SessionID): Promise<void> {
    this.sessionDatabase[sessionId] = {
      sessionId: sessionId,
      currentTrack: null,
      shortEffectTrack: null,
      revision: 0,
    };
    return Promise.resolve();
  }

  getSession(sessionId: SessionID): Promise<SessionPlayingTracks | null> {
    if (!this.sessionDatabase || !this.sessionDatabase[sessionId]) {
      return Promise.resolve(null);
    }

    return Promise.resolve({
      sessionId: sessionId,
      currentTrack: this.sessionDatabase[sessionId]?.currentTrack,
      shortEffectTrack: this.sessionDatabase[sessionId]?.shortEffectTrack ?? null,
      revision: this.sessionDatabase[sessionId].revision,
    });
  }

  getAllSessions(): Promise<SessionPlayingTracks[]> {
    return Promise.resolve(Object.values(this.sessionDatabase));
  }

  async save(track: Track): Promise<void> {
    this.tracksDatabase = this.tracksDatabase.filter((item) => item.id !== track.id); // remove before update
    this.tracksDatabase.push({ ...track });
    return Promise.resolve(undefined);
  }

  upsertCurrentTrack(sessionId: string, playingTrack: PlayingTrack): Promise<SessionPlayingTracks> {
    const revision = this.nextRevision(sessionId);
    const stampedTrack = withRevision(playingTrack, revision);
    if (!this.sessionDatabase[sessionId]) {
      this.sessionDatabase[sessionId] = {
        sessionId: sessionId,
        currentTrack: stampedTrack,
        shortEffectTrack: null,
        revision,
      };
    } else {
      this.sessionDatabase[sessionId].currentTrack = stampedTrack;
      this.sessionDatabase[sessionId].revision = revision;
    }
    return Promise.resolve(snapshot(this.sessionDatabase[sessionId]));
  }

  upsertShortEffectTrack(sessionId: string, playingTrack: PlayingTrack): Promise<SessionPlayingTracks> {
    const revision = this.nextRevision(sessionId);
    const stampedTrack = withRevision(playingTrack, revision);
    if (!this.sessionDatabase[sessionId]) {
      this.sessionDatabase[sessionId] = {
        sessionId: sessionId,
        currentTrack: null,
        shortEffectTrack: stampedTrack,
        revision,
      };
    } else {
      this.sessionDatabase[sessionId].shortEffectTrack = stampedTrack;
      this.sessionDatabase[sessionId].revision = revision;
    }
    return Promise.resolve(snapshot(this.sessionDatabase[sessionId]));
  }

  private nextRevision(sessionId: string): number {
    return (this.sessionDatabase[sessionId]?.revision ?? 0) + 1;
  }

  getTrack(trackId: string): Promise<Track> {
    const track = this.tracksDatabase.find((x) => x.id === trackId);
    if (!track) {
      throw new Error(`track not found for id: ${trackId}`);
    }
    return Promise.resolve({ ...track });
  }

  getAllTracks(sessionId: string): Promise<Track[]> {
    return Promise.resolve(this.tracksDatabase.filter((x) => x.sessionId === sessionId));
  }
}

/**
 * Detach the returned session from the one this store keeps mutating. Without this the caller holds a live
 * reference, and a later write silently rewrites a value they already read — which is not how the Firestore
 * implementation behaves, so tests passing against one would not pass against the other.
 */
function snapshot(session: SessionPlayingTracks): SessionPlayingTracks {
  return { ...session };
}

/**
 * The caller builds the PlayingTrack before the store knows which revision it will get, so the revision is
 * stamped on here rather than passed in. Returns a copy: callers keep their own reference to the argument.
 */
function withRevision(playingTrack: PlayingTrack, revision: number): PlayingTrack {
  return new PlayingTrack(
    playingTrack.id,
    playingTrack.name,
    playingTrack.url,
    playingTrack.duration,
    playingTrack.isPaused,
    playingTrack.playTimestamp,
    playingTrack.trackStartTime,
    revision
  );
}
