import { Body, Controller, Get, Param, Post, Put, UploadedFile, UseInterceptors } from '@nestjs/common';
import { TrackService } from './admin-api/TrackService';
import { Database } from './admin-api/Database';
import { ManageCurrentlyPlayingTracks } from './admin-api/ManageCurrentlyPlayingTracks';
import {
  PlayingTrack,
  Track,
  TrackCreation,
  TracksFromDirectoryCreation,
  TrackToPlay, TrackUpdate
} from '@rpg-maestro/rpg-maestro-api-contract';
import { FirestoreDatabase } from './infrastructure/FirestoreDatabase';
import * as process from 'node:process';
import { InMemoryDatabase } from './infrastructure/InMemoryDatabase';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';
import 'multer';
import { FileUploadService } from './infrastructure/fileUpload/FileUploadService';

@Controller()
export class AppController {
  private readonly database: Database;
  private readonly trackService: TrackService;
  private readonly manageCurrentlyPlayingTracks: ManageCurrentlyPlayingTracks;

  constructor(private readonly fileUploadService: FileUploadService){
    this.fileUploadService =fileUploadService;
    const databaseImpl: string | undefined = process.env.DATABASE;
    if (databaseImpl === 'firestore') {
      console.log('using firestore as database');
      this.database = new FirestoreDatabase();
    } else if (databaseImpl === 'in-memory' || !databaseImpl) {
      this.database = new InMemoryDatabase();
      console.log('using in-memory database');
    } else {
      throw new Error(`database wanted implementation: "${process.env.DATABASE}" is not handled`);
    }
    this.trackService = new TrackService(this.database);
    this.manageCurrentlyPlayingTracks = new ManageCurrentlyPlayingTracks(this.database);
  }

  @Post('/admin/tracks/directory')
  createAllTracksFromDirectory(@Body() tracksFromDirectoryCreation: TracksFromDirectoryCreation): Promise<void> {
    console.log(tracksFromDirectoryCreation);
    return this.trackService.createAllTracksFromDirectory(tracksFromDirectoryCreation);
  }

  @Post('/admin/tracks')
  postTrack(@Body() trackCreation: TrackCreation): Promise<Track> {
    return this.trackService.createTrack(trackCreation);
  }

  @Put('/admin/tracks/:id')
  updateTrack(@Param('id') id: string, @Body() trackUpdate: TrackUpdate): Promise<Track> {
    return this.trackService.updateTrack(id, trackUpdate);
  }

  @Get('/admin/tracks')
  getAllTracks(): Promise<Track[]> {
    return this.trackService.getAll();
  }

  @Post('/admin/tracks/upload')
  @UseInterceptors(FileInterceptor('file'))
  uploadTrack(@UploadedFile() file: Express.Multer.File) {
    return this.fileUploadService.handleFileUpload(file);
  }

  @Put('/admin/sessions/current/tracks')
  changeCurrentTrack(@Body() trackToPlay: TrackToPlay): Promise<void> {
    return this.manageCurrentlyPlayingTracks.changeCurrentTrack(trackToPlay);
  }

  @Get('/tracks/:id')
  getTrack(@Param('id') id: string): Promise<Track> {
    return this.trackService.get(id);
  }

  @Get('/sessions/current/tracks')
  getCurrentTrack(): Promise<PlayingTrack> {
    return this.trackService.getCurrentlyPlaying();
  }
}
