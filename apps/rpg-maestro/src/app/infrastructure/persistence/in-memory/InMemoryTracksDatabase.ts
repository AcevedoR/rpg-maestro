import { TracksDatabase } from '../../../maestro-api/TracksDatabase';
import { PlayingTrack, SessionPlayingTracks, Track } from '@rpg-maestro/rpg-maestro-api-contract';

export class InMemoryTracksDatabase implements TracksDatabase {
  tracksDatabase: Track[] = [];
  sessionDatabase: { [name: string]: InMemorySession } = {};

  async save(track: Track): Promise<void> {
    this.tracksDatabase = this.tracksDatabase.filter((item) => item.id !== track.id); // remove before update
    this.tracksDatabase.push({ ...track });
    return Promise.resolve(undefined);
  }

  getCurrentSession(sessionId: string): Promise<SessionPlayingTracks> {
    if (!this.sessionDatabase || !this.sessionDatabase[sessionId]) {
      throw new Error('no session is playing');
    }
    return Promise.resolve({
      currentTrack: this.sessionDatabase[sessionId].currentTrack,
    });
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
