import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { TrackService } from "./admin-api/TrackService";
import { Database } from "./admin-api/Database";
import { ManageCurrentlyPlayingTracks, TrackToPlay } from './admin-api/ManageCurrentlyPlayingTracks';
import { InMemoryDatabase } from './infrastructure/InMemoryDatabase';
import { PlayingTrack, Track, TrackCreation } from '@rpg-maestro/rpg-maestro-api-contract';

@Controller()
export class AppController {
  private readonly database: Database;
  private readonly trackService: TrackService;
  private readonly manageCurrentlyPlayingTracks: ManageCurrentlyPlayingTracks;

  constructor() {
    this.database = new InMemoryDatabase();
    this.trackService = new TrackService(this.database);
    this.manageCurrentlyPlayingTracks = new ManageCurrentlyPlayingTracks(this.database);
  }

  @Post("/admin/tracks")
  postTrack(@Body() trackCreation: TrackCreation): Promise<Track> {
    return this.trackService.createTrack(trackCreation);
  }
  @Get("/admin/tracks")
  getAllTracks():Promise<Track[]>{
    return this.trackService.getAll();
  }

  @Put("/admin/sessions/current/tracks")
  changeCurrentTrack(@Body() trackToPlay: TrackToPlay):Promise<void>{
    return this.manageCurrentlyPlayingTracks.changeCurrentTrack(trackToPlay);
  }

  @Get('/tracks/:id')
  getTrack(@Param('id') id: string):Promise<Track>{
    return this.trackService.get(id);
  }
  @Get('/sessions/current/tracks')
  getCurrentTrack():Promise<PlayingTrack>{
    return this.trackService.getCurrentlyPlaying();
  }
}
