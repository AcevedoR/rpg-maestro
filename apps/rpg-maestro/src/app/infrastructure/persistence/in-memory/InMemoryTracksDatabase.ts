import { TracksDatabase } from '../../../maestro-api/TracksDatabase';
import { PlayingTrack, SessionID, SessionPlayingTracks, Track, UserID } from '@rpg-maestro/rpg-maestro-api-contract';

export class InMemoryTracksDatabase implements TracksDatabase {
  tracksDatabase: Track[] = [];
  sessionDatabase: { [name: SessionID]: InMemorySession } = {};

  createSession(sessionId: SessionID): Promise<void> {
    this.sessionDatabase[sessionId] = { currentTrack: null };
    return Promise.resolve();}

  getSession(sessionId: SessionID): Promise<SessionPlayingTracks | null> {
    if (!this.sessionDatabase || !this.sessionDatabase[sessionId]) {
      return Promise.resolve(null);
    }

    return Promise.resolve({
      sessionId: sessionId,
      currentTrack: this.sessionDatabase[sessionId]?.currentTrack,
    });
  }

  async save(track: Track): Promise<void> {
    this.tracksDatabase = this.tracksDatabase.filter((item) => item.id !== track.id); // remove before update
    this.tracksDatabase.push({ ...track });
    return Promise.resolve(undefined);
  }

  upsertCurrentTrack(sessionId: string, playingTrack: PlayingTrack): Promise<void> {
    if (!this.sessionDatabase[sessionId]) {
      this.sessionDatabase[sessionId] = { currentTrack: playingTrack };
    } else {
      this.sessionDatabase[sessionId].currentTrack = playingTrack;
    }
    return Promise.resolve();
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
export interface InMemorySession {
  currentTrack: PlayingTrack;
}
