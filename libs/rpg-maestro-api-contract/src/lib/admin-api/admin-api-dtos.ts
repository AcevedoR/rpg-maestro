import { IsIn } from 'class-validator';
import { Role, RolesList, UserID } from '../User';
import { SessionID } from '../SessionPlayingTracks';
import { PlayingTrack } from '../PlayingTrack';

/** Live snapshot of one session for the admin overview: who runs it, and who is listening right now. */
export interface AdminSessionOverview {
  sessionId: SessionID;
  /** users holding access on this session — its GMs */
  gms: UserID[];
  /** player streams currently open, across all instances */
  connectedPlayers: number;
  currentTrack: PlayingTrack | null;
}

export class UpdateUserRole {
  @IsIn(RolesList)
  role: Role;

  constructor(role: Role) {
    this.role = role;
  }
}
