import { User } from '@rpg-maestro/rpg-maestro-api-contract';
import { getUserFromSessionStorage, saveUserInSessionStorage } from './session-storage.service';
import { getUserFromAPI } from '../maestro-ui/maestro-api';

export async function getUserAndForceRefresh() {
  const user = await getUserFromAPI();
  saveUserInSessionStorage(user);
  return user;
}

export async function getUser(): Promise<User | null> {
  let user = getUserFromSessionStorage();
  if (!user) {
    user = await getUserFromAPI();
    saveUserInSessionStorage(user);
  }
  return user;
}
