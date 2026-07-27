import { getUserFromSessionStorage } from '../cache/session-storage.service';

const LANDING_SOURCE_STORAGE_KEY = 'rpg-maestro-landing-source';
const SESSION_CREATED_STORAGE_KEY = 'rpg-maestro-session-created';

export function getLandingSource(): string | undefined {
  const source = new URLSearchParams(window.location.search).get('src');
  if (source) {
    return source.slice(0, 100);
  }
  return getPersistedLandingSource();
}

export function getLandingReferrer(): string | undefined {
  return document.referrer ? document.referrer.slice(0, 2048) : undefined;
}

// carry the ?src= slug through the Start free navigation so the created session keeps its origin
export function persistLandingSource(): void {
  const source = new URLSearchParams(window.location.search).get('src');
  if (!source) {
    return;
  }
  try {
    localStorage.setItem(LANDING_SOURCE_STORAGE_KEY, source.slice(0, 100));
  } catch {
    // storage unavailable (privacy mode): attribution is best-effort
  }
}

export function getPersistedLandingSource(): string | undefined {
  try {
    return localStorage.getItem(LANDING_SOURCE_STORAGE_KEY) ?? undefined;
  } catch {
    return undefined;
  }
}

export function markSessionCreated(sessionId: string): void {
  try {
    localStorage.setItem(SESSION_CREATED_STORAGE_KEY, sessionId);
  } catch {
    // storage unavailable (privacy mode): the marker is best-effort
  }
}

export function hasCreatedSession(): boolean {
  try {
    if (localStorage.getItem(SESSION_CREATED_STORAGE_KEY)) {
      return true;
    }
  } catch {
    // fall through to the session-storage user cache
  }
  const user = getUserFromSessionStorage();
  return !!user?.sessions && Object.keys(user.sessions).length > 0;
}
