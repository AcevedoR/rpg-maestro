import { Database } from "../admin-api/Database";
import { SessionDatabase } from "./SessionDatabase";
import { Session } from "../model/Session";
import { PlayingTrack, Track } from '@rpg-maestro/rpg-maestro-api-contract';

export class InMemoryDatabase implements Database {
  tracksDatabase: Track[] = [];
  sessionDatabase?: SessionDatabase;

  save(track: Track): Promise<void> {
    this.tracksDatabase.push(track);
    return Promise.resolve(undefined);
  }

  getCurrentSession(): Promise<Session> {
    if (!this.sessionDatabase) {
      throw new Error("no session is playing");
    }
    return Promise.resolve({
      currentTrack: this.sessionDatabase.currentTrack,
    });
  }

  upsertCurrentTrack(playingTrack: PlayingTrack): Promise<void> {
    if (!this.sessionDatabase) {
      this.sessionDatabase = { currentTrack: playingTrack };
    }else{
      this.sessionDatabase.currentTrack = playingTrack;
    }

    return Promise.resolve();
  }

  getTrack(trackId: string): Promise<Track> {
    const track = this.tracksDatabase.find((x) => x.id === trackId);
    if (!track) {
      throw new Error(`track not found for id: ${trackId}`);
    }
    return Promise.resolve(track);
  }
  getAllTracks(): Promise<Track[]> {
    return Promise.resolve(this.tracksDatabase);
  }
}
