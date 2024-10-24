import { Injectable } from '@nestjs/common';
import { TrackCreation } from './model/TrackCreation';

@Injectable()
export class AppService {
  createTrack(createTrack: TrackCreation): { message: string } {
    return { message: 'Hello API' };
  }
}
