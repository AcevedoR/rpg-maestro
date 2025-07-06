import { ForbiddenException, HttpException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  TrackCollection,
  TrackCollectionCreation,
  TrackCollectionImportFromSession,
  TrackCollectionUpdate,
} from '@rpg-maestro/rpg-maestro-api-contract';
import { DatabaseWrapperConfiguration } from '../DatabaseWrapperConfiguration';
import { getTrackFileMetadata } from '../maestro-api/TrackService';
import { TrackCollectionDatabase } from './track-collection-database';
import { TracksDatabase } from '../maestro-api/TracksDatabase';

@Injectable()
export class TrackCollectionService {
  trackCollectionDatabase: TrackCollectionDatabase;
  tracksDatabase: TracksDatabase;

  constructor(@Inject(DatabaseWrapperConfiguration) databaseWrapper: DatabaseWrapperConfiguration) {
    this.trackCollectionDatabase = databaseWrapper.getTrackCollectionDB();
    this.tracksDatabase = databaseWrapper.getTracksDB();
  }

  async create(creation: TrackCollectionCreation, userId: string): Promise<TrackCollection> {
    // todo make if failsafe
    if ((await this.trackCollectionDatabase.get(creation.id)) !== null) {
      throw new HttpException(
        `Cannot create Track collection, a collection with id: ${creation.id} already exists`,
        409
      );
    }
    for (const track of creation.tracks) {
      await getTrackFileMetadata(track.url);
    }
    const collection = await this.trackCollectionDatabase.upsert(creation, userId);
    return collection;
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
    for (const track of tracksToImport) {
      await getTrackFileMetadata(track.url);
    }
    return await this.trackCollectionDatabase.upsert(
      {
        id: importFromSessionRequest.id,
        name: importFromSessionRequest.name,
        description: importFromSessionRequest.description,
        tracks: tracksToImport,
      },
      userId
    );
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
    const existing = await this.get(id);

    return;
  }

  async delete(id: string, userId: string): Promise<void> {
    const existing = await this.get(id);

    // Only the creator can delete the collection
    if (existing.created_by !== userId) {
      throw new ForbiddenException('Only the creator can delete this collection');
    }

    await this.trackCollectionDatabase.delete(id);
  }
}
