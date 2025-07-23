import { HttpException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  CollectionTrack,
  TrackCollection,
  TrackCollectionCreation,
  TrackCollectionImportFromSession,
  TrackCollectionUpdate,
} from '@rpg-maestro/rpg-maestro-api-contract';
import { DatabaseWrapperConfiguration } from '../DatabaseWrapperConfiguration';
import { getTrackFileMetadata } from '../maestro-api/TrackService';
import { TrackCollectionsDatabase } from './track-collections-database';
import { TracksDatabase } from '../maestro-api/TracksDatabase';
import { v4 as uuid } from 'uuid';

@Injectable()
export class TrackCollectionService {
  trackCollectionDatabase: TrackCollectionsDatabase;
  tracksDatabase: TracksDatabase;

  constructor(@Inject(DatabaseWrapperConfiguration) databaseWrapper: DatabaseWrapperConfiguration) {
    this.trackCollectionDatabase = databaseWrapper.getTrackCollectionDB();
    this.tracksDatabase = databaseWrapper.getTracksDB();
  }

  async create(creation: TrackCollectionCreation, userId: string): Promise<TrackCollection> {
    if ((await this.trackCollectionDatabase.get(creation.id)) !== null) {
      throw new HttpException(
        `Cannot create Track collection, a collection with id: ${creation.id} already exists`,
        409
      );
    }
    return await this.upsert(creation, userId);
  }

  private async upsert(creation: TrackCollectionCreation, userId: string) {
    const tracks: CollectionTrack[] = [];
    for (const track of creation.tracks) {
      await getTrackFileMetadata(track.url);
      tracks.push({
        id: uuid(),
        source: track.source,
        name: track.name,
        url: track.url,
        tags: track.tags ?? [],
      });
    }

    const now = Date.now();
    const newTrackCollection: TrackCollection = {
      id: creation.id,
      name: creation.name,
      description: creation.description,
      created_at: now,
      updated_at: now,
      created_by: userId,
      tracks: tracks,
    };
    return await this.trackCollectionDatabase.upsert(newTrackCollection);
  }

  async importFromSession(
    importFromSessionRequest: TrackCollectionImportFromSession,
    userId: string
  ): Promise<TrackCollection> {
    if ((await this.trackCollectionDatabase.get(importFromSessionRequest.id)) !== null) {
      throw new HttpException(
        `Cannot import Track collection from session, a collection with id: ${importFromSessionRequest.id} already exists`,
        409
      );
    }
    const session = await this.tracksDatabase.getSession(importFromSessionRequest.sessionId);
    if (!session) {
      throw new HttpException(
        `Cannot import Track collection from session, session does not exist: ${importFromSessionRequest.sessionId}`,
        404
      );
    }
    const tracksToImport = await this.tracksDatabase.getAllTracks(session.sessionId);
    if (tracksToImport.length === 0) {
      throw new HttpException(
        `Cannot import Track collection from session, no track exist for session: ${importFromSessionRequest.sessionId}`,
        422
      );
    }
    const tracks: CollectionTrack[] = [];
    for (const track of tracksToImport) {
      await getTrackFileMetadata(track.url);
      tracks.push({
        id: uuid(),
        source: track.source,
        name: track.name,
        url: track.url,
        tags: track.tags ?? [],
      });
    }

    const now = Date.now();
    const newTrackCollection: TrackCollection = {
      id: importFromSessionRequest.id,
      name: importFromSessionRequest.name,
      description: importFromSessionRequest.description,
      created_at: now,
      updated_at: now,
      created_by: userId,
      tracks: tracks,
    };
    return await this.trackCollectionDatabase.upsert(newTrackCollection);
  }

  async get(id: string): Promise<TrackCollection> {
    const collection = await this.trackCollectionDatabase.get(id);
    if (!collection) {
      throw new NotFoundException(`TrackCollection with id ${id} not found`);
    }
    return collection;
  }

  async getAll(): Promise<TrackCollection[]> {
    return await this.trackCollectionDatabase.getAll();
  }

  async update(id: string, update: TrackCollectionUpdate, userId: string): Promise<TrackCollection> {
    return this.upsert(update, userId)
  }

  async delete(id: string, userId: string): Promise<void> {
    const existing = await this.get(id);
    if (!existing) {
      throw new NotFoundException(`Cannot delete TrackCollection with id ${id} it was not found`);
    }
    await this.trackCollectionDatabase.delete(id);
  }
}
