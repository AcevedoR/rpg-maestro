import { Controller, Get, HttpException, HttpStatus, Inject, Param } from '@nestjs/common';
import {
  SessionPlayingTracksResponse,
  Track,
  toSessionPlayingTracksResponse,
} from '@rpg-maestro/rpg-maestro-api-contract';
import { SessionsService } from './sessions/sessions.service';
import { TrackService } from './maestro-api/TrackService';

@Controller()
export class PlayersController {
  constructor(@Inject(SessionsService) private sessionsService: SessionsService, @Inject(TrackService) private trackService: TrackService) {}

  @Get('/migrate')
  async migrate(): Promise<string> {
    await this.trackService.migrateTracksTmp();
    return 'done';
  }
  @Get('/tracks/:id')
  getTrack(@Param('id') id: string): Promise<Track> {
    return this.trackService.get(id);
  }

  @Get('/sessions/:id/playing-tracks')
  async getSessionTracks(@Param('id') sessionId: string): Promise<SessionPlayingTracksResponse> {
    const dbValue = await this.sessionsService.getSessionPlayingTracks(sessionId);
    if (!dbValue) {
      throw new HttpException(`Session '${sessionId}' not found`, HttpStatus.NOT_FOUND);
    }
    // Resolved here, against the server clock, and never stored: players must not compute the playhead from
    // their own Date.now(), which is off by their whole clock offset from ours.
    return toSessionPlayingTracksResponse(dbValue);
  }
}
