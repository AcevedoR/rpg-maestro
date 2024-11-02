import { Database } from './Database';
import { PlayingTrack } from '@rpg-maestro/rpg-maestro-api-contract';
import { TrackToPlay } from '@rpg-maestro/rpg-maestro-api-contract';

export class ManageCurrentlyPlayingTracks {
  database: Database;

  constructor(database: Database) {
    this.database = database;
  }

  async changeCurrentTrack(trackToPlay: TrackToPlay) {
    if (!trackToPlay || !trackToPlay.trackId) {
      throw new Error('when changeCurrentTrack, trackId is required');
    }

    const track = await this.database.getTrack(trackToPlay.trackId);
    await this.database.upsertCurrentTrack(
      new PlayingTrack(track.id, track.name, track.url, track.duration, trackToPlay?.paused ?? false, Date.now(), 0)
    );
    return Promise.resolve();
  }
}
