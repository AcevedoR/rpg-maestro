import { Controller, Get, HttpException, HttpStatus, Inject, Param } from '@nestjs/common';
import { SessionPlayingTracks, Track } from '@rpg-maestro/rpg-maestro-api-contract';
import { SessionsService } from './sessions/sessions.service';
import { TrackService } from './maestro-api/TrackService';

@Controller()
export class PlayersController {
  constructor(@Inject() private sessionsService: SessionsService, @Inject() private trackService: TrackService) {}

  @Get('/tracks/:id')
  getTrack(@Param('id') id: string): Promise<Track> {
    return this.trackService.get(id);
  }

  @Get('/sessions/:id/playing-tracks')
  async getSessionTracks(@Param('id') sessionId: string): Promise<SessionPlayingTracks> {
    const dbValue = await this.sessionsService.getSessionPlayingTracks(sessionId);
    if (!dbValue) {
      throw new HttpException(`Session '${sessionId}' not found`, HttpStatus.NOT_FOUND);
    }
    return dbValue;
  }
}
