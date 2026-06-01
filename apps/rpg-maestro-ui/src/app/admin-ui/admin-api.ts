import { SessionPlayingTracks, User } from '@rpg-maestro/rpg-maestro-api-contract';
import { authenticatedFetch } from '../utils/authenticated-fetch';
import { rpgMaestroApiUrl } from '../utils/api-config';

export async function getAllSessions(): Promise<SessionPlayingTracks[]> {
  try {
    const response = await authenticatedFetch(`${rpgMaestroApiUrl}/maestro/admin/sessions`, {
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
    const response = await authenticatedFetch(`${rpgMaestroApiUrl}/maestro/admin/users`, {
      credentials: 'include',
    });
    return response as User[];
  } catch (error) {
    console.error(error);
    return Promise.reject();
  }
}
