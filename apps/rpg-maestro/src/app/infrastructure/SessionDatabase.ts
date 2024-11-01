import { PlayingTrack } from '@rpg-maestro/rpg-maestro-api-contract';

export interface SessionDatabase {
  currentTrack: PlayingTrack;
}
