import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { TrackCreation } from "./model/TrackCreation";
import { TrackService } from "./admin-api/TrackService";
import { Database } from "./admin-api/Database";
import { ManageCurrentlyPlayingTracks } from './admin-api/ManageCurrentlyPlayingTracks';
import { InMemoryDatabase } from './infrastructure/InMemoryDatabase';
import { Track } from './model/Track';

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

  @Get('/tracks/:id')
  getTrack(@Param('id') id: string):Promise<Track>{
    return this.trackService.get(id);
  }
}
