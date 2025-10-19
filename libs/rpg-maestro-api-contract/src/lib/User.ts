import { SessionID } from './SessionPlayingTracks';

export interface User {
  id: UserID;

  created_at: number;
  updated_at: number | undefined;

  role: Role;

  sessions?: Record<SessionID, SessionAccess>
}
export interface SessionAccess {
  created_at: number;
  updated_at: number | undefined;
  access: SessionAccessLevel;
}
export type SessionAccessLevel = 'OWNER';

export type UserID = string;
export const RolesList = ['MINSTREL', 'MAESTRO', 'ADMIN'] as const;
export type Role = typeof RolesList[number];
