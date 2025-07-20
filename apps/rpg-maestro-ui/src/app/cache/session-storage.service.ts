import { User } from '@rpg-maestro/rpg-maestro-api-contract';

const USER_SESSION_STORAGE_KEY = 'participants';

export function saveUserInSessionStorage(user: User) {
  sessionStorage.setItem(USER_SESSION_STORAGE_KEY, JSON.stringify(user));
}
export function getUserFromSessionStorage(): User | null {
  const userInSessionStorage = sessionStorage.getItem(USER_SESSION_STORAGE_KEY);
  if (!userInSessionStorage) {
    return null;
  }
  return JSON.parse(userInSessionStorage);
}
