import { Database } from './Database';
import { Track } from '../model/Track';

export class InMemoryDatabase implements Database{
  memoryDb: Track[]= [];

  save(track: Track): Promise<void> {
    this.memoryDb.push(track);
    return Promise.resolve(undefined);
  }
}