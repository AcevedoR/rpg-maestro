export interface User {
  id: UserID;

  created_at: number;
  updated_at: number;

  role: Role;
}

export type UserID = string;
export type Role = 'MINSTREL' | 'MAESTRO';
