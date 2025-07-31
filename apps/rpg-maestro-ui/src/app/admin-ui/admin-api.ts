import { SessionPlayingTracks, User } from '@rpg-maestro/rpg-maestro-api-contract';
import { fetchClient } from '../utils/fetch-client';

const rpgmaestroapiurl = import.meta.env.VITE_RPG_MAESTRO_API_URL; // TODO centralize

export async function getAllSessions(): Promise<SessionPlayingTracks[]> {
  try {
    const response = await fetchClient(`${rpgmaestroapiurl}/maestro/admin/sessions`, {
      credentials: 'include',
    });
    return response as SessionPlayingTracks[];
  } catch (error) {
    console.error(error);
    return Promise.reject();
  }
}

export async function getAllUsers(): Promise<User[]> {
  try {
    const response = await fetchClient(`${rpgmaestroapiurl}/maestro/admin/users`, {
      credentials: 'include',
    });
    return response as User[];
  } catch (error) {
    console.error(error);
    return Promise.reject();
  }
}
